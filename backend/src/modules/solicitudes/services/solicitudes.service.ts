import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { Usuario, RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { TecnicoCategoria } from '../../perfiles-tecnico/entities/tecnico-categoria.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import { CalificarSolicitudDto } from '../dtos/calificar-solicitud.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SolicitudesDisponibilidadService } from './solicitudes-disponibilidad.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';
import { SolicitudesConsultaService, type FiltrosSolicitudes } from './solicitudes-consulta.service';
import { SolicitudesPostulacionesService } from './solicitudes-postulaciones.service';
import { SolicitudesCalificacionesService } from './solicitudes-calificaciones.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(SolicitudCategoria)
    private readonly solicitudCategoriasRepository: Repository<SolicitudCategoria>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    private readonly disponibilidadService: SolicitudesDisponibilidadService,
    private readonly notificacionesService: SolicitudesNotificacionesService,
    private readonly consultasService: SolicitudesConsultaService,
    private readonly postulacionesService: SolicitudesPostulacionesService,
    private readonly calificacionesService: SolicitudesCalificacionesService,
    @InjectRepository(CategoriaServicio)
    private readonly categoriasRepository: Repository<CategoriaServicio>,
  ) {}

  async crear(clienteId: string, dto: CrearSolicitudDto, idempotencyKey?: string) {
    const clave = idempotencyKey?.trim() || null;
    if (clave) {
      const solicitudExistente = await this.solicitudesRepository.findOneBy({
        cliente_id: clienteId,
        idempotency_key: clave,
      });
      if (solicitudExistente) {
        return this.detalle(solicitudExistente.id, {
          id: clienteId,
          rol: RolUsuario.CLIENTE,
        } as AuthenticatedUser);
      }
    }
    const categoriaIds = [...new Set(dto.categoria_ids)];
    const categoriasPersonalizadas = [
      ...new Set((dto.categorias_personalizadas ?? []).map((valor) => valor.trim()).filter(Boolean)),
    ];
    if (categoriaIds.length + categoriasPersonalizadas.length > 1) {
      throw new BadRequestException(
        'Solo puedes incluir una categoría por solicitud. Crea otra solicitud para servicios de otra categoría.',
      );
    }
    if (categoriaIds.length + categoriasPersonalizadas.length === 0) {
      throw new BadRequestException('Debes seleccionar una categoría para la solicitud');
    }
    for (const nombre of categoriasPersonalizadas) {
      if (!this.categoriasRepository) continue;
      let categoria = await this.categoriasRepository.findOne({
        where: { nombre },
      });
      if (!categoria) {
        categoria = await this.categoriasRepository.save(
          this.categoriasRepository.create({
            nombre,
            descripcion: 'Categoría creada por una solicitud',
            icono: 'pi pi-tag',
            activa: true,
          }),
        );
      }
      categoriaIds.push(categoria.id);
    }
    const categoriasPorNombre =
      categoriaIds.length > 0 && this.categoriasRepository
        ? await this.categoriasRepository.find({
            where: { id: In(categoriaIds) },
          })
        : [];
    const tiposPorCategoria: Record<string, string[]> = {};
    for (const [clave, tipos] of Object.entries(dto.tipos_servicio_por_categoria ?? {})) {
      const categoriaId = categoriaIds.includes(clave)
        ? clave
        : categoriasPorNombre.find((categoria) => categoria.nombre === clave)?.id;
      if (!categoriaId) continue;
      const propios = [...new Set(
        (tipos ?? [])
          .map((tipo) => tipo.trim().slice(0, 150))
          .filter(Boolean),
      )];
      tiposPorCategoria[categoriaId] = propios;
    }

    if (Object.keys(tiposPorCategoria).length === 0) {
      const tiposGlobales = [...new Set(
        dto.tipos_servicio.map((tipo) => tipo.trim()).filter(Boolean),
      )];
      for (const categoria of categoriasPorNombre) {
        const nombre = categoria.nombre.toLocaleLowerCase('es');
        const opciones =
          nombre.includes('aire') || nombre.includes('climat')
            ? ['Instalación', 'Mantenimiento preventivo', 'Reparación', 'Recarga de gas', 'Limpieza']
            : nombre.includes('carpinter')
              ? ['Fabricación', 'Reparación', 'Instalación', 'Restauración']
              : null;
        if (!opciones) continue;
        tiposPorCategoria[categoria.id] = tiposGlobales.filter((tipo) =>
          opciones.some((opcion) => opcion.toLocaleLowerCase('es') === tipo.toLocaleLowerCase('es')),
        );
      }
    }

    if (dto.tecnico_id) {
      if (clienteId === dto.tecnico_id) {
        throw new BadRequestException('No puedes solicitar un servicio a tu propio perfil');
      }
      const tecnico = await this.usuariosRepository.findOneBy({ id: dto.tecnico_id });
      if (!tecnico) {
        throw new NotFoundException('El tǸcnico seleccionado no existe');
      }
      if (tecnico.rol !== RolUsuario.TECNICO) {
        throw new BadRequestException('El usuario seleccionado no es un tǸcnico');
      }
      const perfil = await this.perfilesRepository.findOneBy({ usuario_id: dto.tecnico_id });
      if (!perfil) {
        throw new BadRequestException('El tǸcnico aǧn no ha completado su perfil');
      }
    }
    const ahora = new Date();
    if (dto.fecha_propuesta && dto.hora_propuesta) {
      const propuesta = new Date(`${dto.fecha_propuesta}T${dto.hora_propuesta}:00`);
      if (Number.isNaN(propuesta.getTime()) || propuesta <= ahora) {
        throw new BadRequestException('La hora propuesta debe ser posterior a la hora actual');
      }
    }
    const hastaFinDia = dto.oferta_hasta_fin_dia === true;
    const expiracionOferta = hastaFinDia
      ? new Date(new Date(ahora).setHours(23, 59, 59, 999))
      : new Date(ahora.getTime() + (dto.duracion_oferta_minutos ?? 30) * 60_000);
    const duracionOfertaMinutos = hastaFinDia
      ? Math.max(1, Math.ceil((expiracionOferta.getTime() - ahora.getTime()) / 60_000))
      : (dto.duracion_oferta_minutos ?? 30);
    let solicitud: Solicitud;
    try {
      solicitud = await this.solicitudesRepository.save({
        cliente_id: clienteId,
        tecnico_id: dto.tecnico_id ?? null,
        descripcion: dto.descripcion.trim(),
        direccion: dto.direccion?.trim() || null,
        direccion_latitud: dto.direccion_latitud ?? null,
        direccion_longitud: dto.direccion_longitud ?? null,
        tipos_servicio: [...new Set(dto.tipos_servicio.map((tipo) => tipo.trim()).filter(Boolean))],
        tipos_servicio_por_categoria: tiposPorCategoria,
        oferta_hasta_fin_dia: hastaFinDia,
        idempotency_key: clave,
        fecha_propuesta: dto.fecha_propuesta || null,
        hora_propuesta: dto.hora_propuesta || null,
        estado: EstadoSolicitud.PENDIENTE,
        duracion_oferta_minutos: dto.tecnico_id ? null : duracionOfertaMinutos,
        fecha_expiracion_oferta: dto.tecnico_id ? null : expiracionOferta,
      });
    } catch (error) {
      if ((error as { code?: string }).code !== '23505' || !clave) throw error;
      const solicitudExistente = await this.solicitudesRepository.findOneBy({
        cliente_id: clienteId,
        idempotency_key: clave,
      });
      if (!solicitudExistente) throw error;
      return this.detalle(solicitudExistente.id, {
        id: clienteId,
        rol: RolUsuario.CLIENTE,
      } as AuthenticatedUser);
    }
    if (categoriaIds.length > 0) {
      await this.solicitudCategoriasRepository.insert(
        categoriaIds.map((categoria_id) => ({ solicitud_id: solicitud.id, categoria_id })),
      );
    }
    const vista = await this.detalle(solicitud.id, {
      id: clienteId,
      rol: RolUsuario.CLIENTE,
    } as AuthenticatedUser);
    const dia = dto.fecha_propuesta
      ? new Date(`${dto.fecha_propuesta}T12:00:00`).getDay()
      : new Date().getDay();
    const consultaTecnicos = this.usuariosRepository
      .createQueryBuilder('u')
      .innerJoin(PerfilTecnico, 'p', 'p.usuario_id = u.id')
      .innerJoin(
        DisponibilidadTecnico,
        'd',
        'd.tecnico_id = u.id AND d.dia_semana = :dia',
        { dia },
      )
      .where('u.rol = :rol', { rol: RolUsuario.TECNICO })
      .andWhere('u.estado = :estado', { estado: EstadoUsuario.ACTIVO })
      .select('u.id AS id')
      .distinct(true);

    if (categoriaIds.length > 0) {
      consultaTecnicos
        .innerJoin(TecnicoCategoria, 'tc', 'tc.tecnico_id = u.id')
        .andWhere('tc.categoria_id IN (:...categoriaIds)', { categoriaIds });
    }

    const tecnicosDisponibles = await consultaTecnicos.getRawMany<{ id: string }>();
    await Promise.all(
      tecnicosDisponibles.map((tecnico) => this.notificacionesService.nueva(tecnico.id, vista)),
    );
    if (dto.tecnico_id && !tecnicosDisponibles.some((t) => t.id === dto.tecnico_id)) {
      await this.notificacionesService.nueva(dto.tecnico_id, vista);
    }

    return vista;
  }

  async listarPostulaciones(id: string, user: AuthenticatedUser) {
    return this.consultasService.listarPostulaciones(id, user);
  }

  async postular(id: string, dto: CrearPostulacionDto, user: AuthenticatedUser) {
    return this.postulacionesService.postular(id, dto, user);
  }

  async aceptarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    return this.postulacionesService.aceptarPostulacion(id, postulacionId, user);
  }

  async rechazarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    return this.postulacionesService.rechazarPostulacion(id, postulacionId, user);
  }

  async listarMis(clienteId: string, filtros: FiltrosSolicitudes) {
    return this.consultasService.listarMis(clienteId, filtros);
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosSolicitudes) {
    return this.consultasService.listarRecibidas(tecnicoId, filtros);
  }

  async listarAdmin(filtros: FiltrosSolicitudes) {
    return this.consultasService.listarAdmin(filtros);
  }

  async detalle(id: string, user: AuthenticatedUser) {
    return this.consultasService.detalle(id, user);
  }

  async calificar(id: string, dto: CalificarSolicitudDto, user: AuthenticatedUser) {
    return this.calificacionesService.calificar(id, dto, user);
  }

  async rechazar(id: string, dto: RechazarSolicitudDto, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede rechazar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'Solo se puede rechazar una solicitud pendiente');
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.RECHAZADA,
      motivo_rechazo: dto.motivo_rechazo.trim(),
    });
    await this.disponibilidadService.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Solicitud rechazada',
      `${this.nombreUsuario(vista, 'tecnico') || 'El técnico'} ${this.apellidoUsuario(vista, 'tecnico')} rechazó tu solicitud.`,
      '/solicitudes',
    );
    return vista;
  }

  async cancelar(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.cliente_id === user.id,
      'Solo el cliente solicitante puede cancelar la solicitud',
    );
    this.verEstado(
      solicitud,
      [EstadoSolicitud.PENDIENTE, EstadoSolicitud.ACEPTADA],
      'Solo se puede cancelar una solicitud pendiente o aceptada',
    );
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.CANCELADA,
    });
    await this.disponibilidadService.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    if (solicitud.tecnico_id) {
      await this.notificacionesService.actualizada(
        solicitud.tecnico_id,
        vista,
        'Solicitud cancelada',
        `${this.nombreUsuario(vista, 'cliente')} ${this.apellidoUsuario(vista, 'cliente')} canceló la solicitud.`,
        '/solicitudes/recibidas',
      );
    }
    return vista;
  }

  async completar(id: string, user: AuthenticatedUser) {
    return this.iniciarCompletacion(id, user);
  }

  private generarCodigo(): string {
    return randomInt(1000, 10000).toString();
  }

  async iniciarCompletacion(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede completar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.ACEPTADA], 'Solo se puede completar una solicitud aceptada');

    const codigo = this.generarCodigo();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    await this.solicitudesRepository.update(solicitud.id, {
      codigo_completacion: codigo,
      fecha_expiracion_codigo: expiracion,
      codigo_fallido: false,
      codigo_intentos: 0,
    });

    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Código de confirmación',
      `Tu técnico ha finalizado el trabajo. Código de confirmación: ${codigo} (válido 10 min).`,
      '/solicitudes',
    );

    return { ok: true, expiracion: expiracion.toISOString() };
  }

  async confirmarCompletacion(id: string, codigo: string | undefined, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.tecnico_id !== user.id) {
      throw new ForbiddenException('Solo el técnico asignado puede confirmar la completación');
    }
    if (solicitud.estado !== EstadoSolicitud.ACEPTADA) {
      throw new BadRequestException('La solicitud no está en estado aceptada');
    }
    const codigoNormalizado = typeof codigo === 'string' ? codigo.trim() : '';
    if (!/^\d{4}$/.test(codigoNormalizado)) {
      throw new BadRequestException('Debes ingresar un código válido de 4 dígitos');
    }
    if (!solicitud.codigo_completacion || !solicitud.fecha_expiracion_codigo) {
      throw new BadRequestException('No hay código de completación pendiente');
    }
    if (solicitud.fecha_expiracion_codigo.getTime() <= Date.now()) {
      await this.solicitudesRepository.update(solicitud.id, {
        codigo_completacion: null,
        fecha_expiracion_codigo: null,
        codigo_intentos: 0,
      });
      throw new BadRequestException('El código ha expirado');
    }
    if (solicitud.codigo_completacion !== codigoNormalizado) {
      const intentos = (solicitud.codigo_intentos ?? 0) + 1;
      await this.solicitudesRepository.update(solicitud.id, {
        codigo_fallido: true,
        codigo_intentos: intentos,
        ...(intentos >= 3
          ? {
              codigo_completacion: null,
              fecha_expiracion_codigo: null,
            }
          : {}),
      });
      if (intentos >= 3) {
        throw new BadRequestException('Se agotaron los intentos para este código. Solicita uno nuevo.');
      }
      throw new BadRequestException('Código incorrecto. Verifica el código entregado por el cliente.');
    }

    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.COMPLETADA,
      fecha_completada: new Date(),
      codigo_completacion: null,
      fecha_expiracion_codigo: null,
      codigo_fallido: false,
      codigo_intentos: 0,
    });
    if (solicitud.tecnico_id) {
      await this.perfilesRepository.increment(
        { usuario_id: solicitud.tecnico_id },
        'total_servicios_completados',
        1,
      );
    }
    await this.disponibilidadService.liberarReserva(solicitud.id);

    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Servicio confirmado',
      'El técnico confirmó la completación del servicio con el código recibido.',
      '/solicitudes',
    );
    return vista;
  }

  private async obtenerParaAccion(
    id: string,
    user: AuthenticatedUser,
    acceder: (solicitud: Solicitud) => boolean,
    mensaje: string,
  ) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (user.rol !== RolUsuario.ADMIN && !acceder(solicitud)) {
      throw new ForbiddenException(mensaje);
    }
    return solicitud;
  }

  private verEstado(solicitud: Solicitud, permitidos: EstadoSolicitud[], mensaje: string) {
    if (!permitidos.includes(solicitud.estado)) {
      throw new BadRequestException(mensaje);
    }
  }

  private nombreUsuario(vista: Record<string, unknown>, tipo: 'cliente' | 'tecnico') {
    const usuario = vista[tipo];
    if (!usuario || typeof usuario !== 'object') return '';
    const nombre = (usuario as Record<string, unknown>).nombres;
    return typeof nombre === 'string' ? nombre : '';
  }

  private apellidoUsuario(vista: Record<string, unknown>, tipo: 'cliente' | 'tecnico') {
    const usuario = vista[tipo];
    if (!usuario || typeof usuario !== 'object') return '';
    const apellido = (usuario as Record<string, unknown>).apellidos;
    return typeof apellido === 'string' ? apellido : '';
  }

}
