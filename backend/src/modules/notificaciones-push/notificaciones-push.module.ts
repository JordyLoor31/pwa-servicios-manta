import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionPush } from './entities/suscripcion-push.entity';
import { NotificacionesPushController } from './controllers/notificaciones-push.controller';
import { NotificacionesPushService } from './services/notificaciones-push.service';

@Module({
  imports: [TypeOrmModule.forFeature([SuscripcionPush])],
  controllers: [NotificacionesPushController],
  providers: [NotificacionesPushService],
  exports: [NotificacionesPushService],
})
export class NotificacionesPushModule {}