import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud } from './entities/solicitud.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../perfiles-tecnico/entities/perfil-tecnico.entity';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { SolicitudesService } from './services/solicitudes.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { NotificacionesPushModule } from '../notificaciones-push/notificaciones-push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud, Usuario, PerfilTecnico]),
    NotificacionesModule,
    NotificacionesPushModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}