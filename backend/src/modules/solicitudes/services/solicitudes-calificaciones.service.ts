import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoSolicitud, Solicitud } from '../entities/solicitud.entity';
import { CalificacionTecnico } from '../entities/calificacion-tecnico.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { CalificarSolicitudDto } from '../dtos/calificar-solicitud.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Injectable()
export class SolicitudesCalificacionesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(CalificacionTecnico)
    private readonly calificacionesRepository: Repository<CalificacionTecnico>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
  ) {}

  async calificar(id: string, dto: CalificarSolicitudDto, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.cliente_id !== user.id) {
      throw new ForbiddenException('Solo el cliente del servicio puede calificarlo');
    }
    if (solicitud.estado !== EstadoSolicitud.COMPLETADA) {
      throw new BadRequestException('Solo puedes calificar un servicio completado');
    }
    if (!solicitud.tecnico_id) {
      throw new BadRequestException('La solicitud no tiene un técnico asignado');
    }

    const existente = await this.calificacionesRepository.findOneBy({ solicitud_id: id });
    if (existente) {
      throw new ConflictException('Ya calificaste este servicio');
    }

    let calificacion: CalificacionTecnico;
    try {
      calificacion = await this.calificacionesRepository.save({
        solicitud_id: id,
        cliente_id: user.id,
        tecnico_id: solicitud.tecnico_id,
        calificacion: dto.calificacion,
        comentario: dto.comentario?.trim() || null,
      });
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('Ya calificaste este servicio');
      }
      throw error;
    }

    await this.recalcularPromedio(solicitud.tecnico_id);
    return calificacion;
  }

  private async recalcularPromedio(tecnicoId: string) {
    const fila = await this.calificacionesRepository
      .createQueryBuilder('calificacion')
      .select('AVG(calificacion.calificacion)', 'promedio')
      .where('calificacion.tecnico_id = :tecnicoId', { tecnicoId })
      .getRawOne<{ promedio: string | null }>();
    const promedio = Number(Number(fila?.promedio ?? 0).toFixed(2));
    await this.perfilesRepository.update(
      { usuario_id: tecnicoId },
      { calificacion_promedio: promedio },
    );
  }
}
