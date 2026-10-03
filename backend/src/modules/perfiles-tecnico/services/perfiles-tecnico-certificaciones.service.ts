import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { CertificacionTecnico, EstadoCertificacion } from '../entities/certificacion-tecnico.entity';
import { CrearCertificacionDto } from '../dtos/crear-certificacion.dto';
import { RevisarCertificacionDto } from '../dtos/revisar-certificacion.dto';
import { asegurarPerfil } from './perfiles-tecnico.helpers';

@Injectable()
export class PerfilesTecnicoCertificacionesService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(CertificacionTecnico)
    private readonly certificacionesRepository: Repository<CertificacionTecnico>,
  ) {}

  async obtenerCertificaciones(usuarioId: string) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    return this.certificacionesRepository.find({
      where: { tecnico_id: usuarioId },
      order: { fecha_creacion: 'DESC' },
    });
  }

  async agregarCertificacion(usuarioId: string, dto: CrearCertificacionDto) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    return this.certificacionesRepository.save({
      tecnico_id: usuarioId,
      tipo_documento: dto.tipo_documento.trim(),
      url_documento: dto.url_documento.trim(),
      estado: EstadoCertificacion.PENDIENTE,
    });
  }

  async eliminarCertificacion(usuarioId: string, certificacionId: string) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    const resultado = await this.certificacionesRepository.delete({
      id: certificacionId,
      tecnico_id: usuarioId,
    });
    if (!resultado.affected) {
      throw new NotFoundException('Certificación no encontrada');
    }
    return { id: certificacionId, eliminado: true };
  }

  async revisarCertificacion(certificacionId: string, dto: RevisarCertificacionDto) {
    const certificacion = await this.certificacionesRepository.findOneBy({ id: certificacionId });
    if (!certificacion) {
      throw new NotFoundException('Certificación no encontrada');
    }
    if (dto.estado === EstadoCertificacion.PENDIENTE) {
      throw new BadRequestException('La revisión debe aprobar o rechazar la certificación');
    }
    certificacion.estado = dto.estado;
    certificacion.fecha_revision = new Date();
    return this.certificacionesRepository.save(certificacion);
  }

}
