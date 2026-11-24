import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Repository, type ObjectLiteral } from 'typeorm';
import { SolicitudesService } from './solicitudes.service';
import { EstadoSolicitud, Solicitud } from '../entities/solicitud.entity';
import { CalificacionTecnico } from '../entities/calificacion-tecnico.entity';
import { SolicitudesCalificacionesService } from './solicitudes-calificaciones.service';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { SolicitudesPostulacionesService } from './solicitudes-postulaciones.service';
import { SolicitudesConsultaService } from './solicitudes-consulta.service';
import { PostulacionSolicitud } from '../entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';
import { Direccion } from '../../direcciones/entities/direccion.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SolicitudesDisponibilidadService } from './solicitudes-disponibilidad.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';

const tecnico: AuthenticatedUser = { id: 'tecnico-1', email: 'tecnico@example.com', rol: RolUsuario.TECNICO };
const cliente: AuthenticatedUser = { id: 'cliente-1', email: 'cliente@example.com', rol: RolUsuario.CLIENTE };

type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

function asyncMock(): AsyncMock {
  return jest.fn<(...args: any[]) => Promise<any>>();
}

function repository<T extends ObjectLiteral>(methods: object = {}) {
  return methods as unknown as Repository<T>;
}

function solicitudConCodigo(overrides: Partial<Solicitud> = {}): Solicitud {
  return {
    id: 'solicitud-1',
    cliente_id: cliente.id,
    tecnico_id: tecnico.id,
    estado: EstadoSolicitud.ACEPTADA,
    codigo_completacion: '1234',
    fecha_expiracion_codigo: new Date(Date.now() + 60_000),
    codigo_fallido: false,
    codigo_intentos: 0,
    ...overrides,
  } as Solicitud;
}

function createSolicitudesService() {
  const solicitudesRepository = repository<Solicitud>({
    findOneBy: asyncMock(),
    save: asyncMock(),
    update: asyncMock().mockResolvedValue(undefined),
  });
  const perfilesRepository = repository<PerfilTecnico>({
    increment: asyncMock().mockResolvedValue(undefined),
  });
  const disponibilidadService = { liberarReserva: asyncMock().mockResolvedValue(undefined) };
  const notificacionesService = { actualizada: asyncMock().mockResolvedValue(undefined) };
  const consultasService = { detalle: asyncMock().mockResolvedValue({}) };
  const service = new SolicitudesService(
    solicitudesRepository,
    repository<SolicitudCategoria>(),
    repository<Usuario>(),
    perfilesRepository,
    repository<DisponibilidadTecnico>(),
    disponibilidadService as unknown as SolicitudesDisponibilidadService,
    notificacionesService as unknown as SolicitudesNotificacionesService,
    consultasService as unknown as SolicitudesConsultaService,
    {} as SolicitudesPostulacionesService,
    {} as SolicitudesCalificacionesService,
    repository<CategoriaServicio>(),
  );
  return { service, solicitudesRepository, perfilesRepository };
}

describe('SolicitudesService confirmation code', () => {
  it('generates a four-digit code and resets attempts', async () => {
    const { service, solicitudesRepository } = createSolicitudesService();
    const solicitud = solicitudConCodigo({ estado: EstadoSolicitud.ACEPTADA });
    (solicitudesRepository.findOneBy as AsyncMock).mockResolvedValue(solicitud);

    await service.iniciarCompletacion(solicitud.id, tecnico);

    const update = (solicitudesRepository.update as AsyncMock).mock.calls[0][1] as Partial<Solicitud>;
    expect(update.codigo_completacion).toMatch(/^\d{4}$/);
    expect(update.codigo_intentos).toBe(0);
  });

  it('rejects an expired code and clears it', async () => {
    const { service, solicitudesRepository } = createSolicitudesService();
    const solicitud = solicitudConCodigo({ fecha_expiracion_codigo: new Date(Date.now() - 1) });
    (solicitudesRepository.findOneBy as AsyncMock).mockResolvedValue(solicitud);

    await expect(service.confirmarCompletacion(solicitud.id, '1234', tecnico)).rejects.toThrow(
      'El código ha expirado',
    );
    expect(solicitudesRepository.update).toHaveBeenCalledWith(
      solicitud.id,
      expect.objectContaining({ codigo_completacion: null, codigo_intentos: 0 }),
    );
  });

  it('counts an incorrect code and blocks after three attempts', async () => {
    const { service, solicitudesRepository } = createSolicitudesService();
    const solicitud = solicitudConCodigo({ codigo_intentos: 2 });
    (solicitudesRepository.findOneBy as AsyncMock).mockResolvedValue(solicitud);

    await expect(service.confirmarCompletacion(solicitud.id, '9999', tecnico)).rejects.toThrow(
      'Se agotaron los intentos',
    );
    expect(solicitudesRepository.update).toHaveBeenCalledWith(
      solicitud.id,
      expect.objectContaining({
        codigo_fallido: true,
        codigo_intentos: 3,
        codigo_completacion: null,
        fecha_expiracion_codigo: null,
      }),
    );
  });

  it('completes the service with the correct code', async () => {
    const { service, solicitudesRepository, perfilesRepository } = createSolicitudesService();
    const solicitud = solicitudConCodigo();
    (solicitudesRepository.findOneBy as AsyncMock).mockResolvedValue(solicitud);

    await service.confirmarCompletacion(solicitud.id, '1234', tecnico);

    expect(solicitudesRepository.update).toHaveBeenCalledWith(
      solicitud.id,
      expect.objectContaining({
        estado: EstadoSolicitud.COMPLETADA,
        codigo_completacion: null,
        codigo_intentos: 0,
      }),
    );
    expect(perfilesRepository.increment).toHaveBeenCalled();
  });
});

describe('SolicitudesService idempotency', () => {
  it('rejects requests that include more than one category', async () => {
    const { service } = createSolicitudesService();

    await expect(
      service.crear(cliente.id, {
        descripcion: 'Necesito más de un servicio',
        categoria_ids: ['categoria-aire', 'categoria-carpinteria'],
        tipos_servicio: [],
      } as never),
    ).rejects.toThrow(
      'Solo puedes incluir una categoría por solicitud. Crea otra solicitud para servicios de otra categoría.',
    );
  });

  it('returns the existing request when the same key is retried', async () => {
    const { service, solicitudesRepository } = createSolicitudesService();
    const solicitud = solicitudConCodigo({
      id: 'solicitud-existente',
      cliente_id: cliente.id,
      idempotency_key: 'clave-reutilizada',
    });
    (solicitudesRepository.findOneBy as AsyncMock).mockResolvedValue(solicitud);

    const result = await service.crear(
      cliente.id,
      {
        descripcion: 'Solicitud repetida',
        categoria_ids: [],
      } as never,
      ' clave-reutilizada ',
    );

    expect(result).toEqual({});
    expect(solicitudesRepository.save).not.toHaveBeenCalled();
    expect(solicitudesRepository.findOneBy).toHaveBeenCalledWith({
      cliente_id: cliente.id,
      idempotency_key: 'clave-reutilizada',
    });
  });
});

describe('SolicitudesCalificacionesService', () => {
  it('requires a completed service', async () => {
    const solicitudesRepository = repository<Solicitud>({
      findOneBy: asyncMock().mockResolvedValue(solicitudConCodigo({ estado: EstadoSolicitud.ACEPTADA })),
    });
    const service = new SolicitudesCalificacionesService(
      solicitudesRepository,
      repository<CalificacionTecnico>(),
      repository<PerfilTecnico>(),
      repository<PostulacionSolicitud>({ findOne: asyncMock() }),
    );

    await expect(service.calificar('solicitud-1', { calificacion: 5 }, cliente)).rejects.toThrow(
      'Solo puedes calificar un servicio completado',
    );
  });

  it('rejects a duplicate rating', async () => {
    const solicitudesRepository = repository<Solicitud>({
      findOneBy: asyncMock().mockResolvedValue(solicitudConCodigo({ estado: EstadoSolicitud.COMPLETADA })),
    });
    const calificacionesRepository = repository<CalificacionTecnico>({
      findOneBy: asyncMock().mockResolvedValue({ id: 'calificacion-1' }),
    });
    const service = new SolicitudesCalificacionesService(
      solicitudesRepository,
      calificacionesRepository,
      repository<PerfilTecnico>(),
      repository<PostulacionSolicitud>({ findOne: asyncMock() }),
    );

    await expect(service.calificar('solicitud-1', { calificacion: 5 }, cliente)).rejects.toThrow(
      'Ya calificaste este servicio',
    );
  });
});

describe('SolicitudesPostulacionesService', () => {
  it('rejects a technician outside the coverage radius', async () => {
    const solicitudesRepository = repository<Solicitud>({
      findOneBy: asyncMock().mockResolvedValue(
        solicitudConCodigo({
          estado: EstadoSolicitud.PENDIENTE,
          direccion_latitud: 0,
          direccion_longitud: 0,
        }),
      ),
    });
    const perfilesRepository = repository<PerfilTecnico>({
      findOneBy: asyncMock().mockResolvedValue({ radio_cobertura_km: 1 }),
    });
    const direccionesRepository = repository<Direccion>({
      findOne: asyncMock().mockResolvedValue({ latitud: 1, longitud: 1 }),
    });
    const service = new SolicitudesPostulacionesService(
      solicitudesRepository,
      repository<PostulacionSolicitud>({ findOneBy: asyncMock().mockResolvedValue(null) }),
      repository<SolicitudCategoria>(),
      repository<TarifaTecnico>(),
      perfilesRepository,
      direccionesRepository,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.postular('solicitud-1', {} as CrearPostulacionDto, tecnico),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
