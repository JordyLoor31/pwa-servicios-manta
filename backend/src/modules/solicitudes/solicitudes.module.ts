import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud } from './entities/solicitud.entity';
import { PostulacionSolicitud } from './entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from './entities/solicitud-categoria.entity';
import { ReservaServicio } from './entities/reserva-servicio.entity';
import { TarifaTecnico } from '../perfiles-tecnico/entities/tarifa-tecnico.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../perfiles-tecnico/entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from '../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { SolicitudesService } from './services/solicitudes.service';
import { SolicitudesDisponibilidadService } from './services/solicitudes-disponibilidad.service';
import { SolicitudesNotificacionesService } from './services/solicitudes-notificaciones.service';
import { SolicitudesConsultaService } from './services/solicitudes-consulta.service';
import { SolicitudesPostulacionesService } from './services/solicitudes-postulaciones.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { NotificacionesPushModule } from '../notificaciones-push/notificaciones-push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Solicitud,
      PostulacionSolicitud,
      SolicitudCategoria,
      ReservaServicio,
      TarifaTecnico,
      Usuario,
      PerfilTecnico,
      DisponibilidadTecnico,
    ]),
    NotificacionesModule,
    NotificacionesPushModule,
  ],
  controllers: [SolicitudesController],
  providers: [
    SolicitudesService,
    SolicitudesConsultaService,
    SolicitudesPostulacionesService,
    SolicitudesDisponibilidadService,
    SolicitudesNotificacionesService,
  ],
})
export class SolicitudesModule {}