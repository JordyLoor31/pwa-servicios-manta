import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud } from './entities/solicitud.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../perfiles-tecnico/entities/perfil-tecnico.entity';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { SolicitudesService } from './services/solicitudes.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud, Usuario, PerfilTecnico]),
    NotificacionesModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}