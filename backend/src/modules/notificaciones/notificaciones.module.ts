import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { NotificacionesGateway } from './notificaciones.gateway';

const DEV_JWT_SECRET = 'servicios-manta-secret-dev';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? DEV_JWT_SECRET,
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [NotificacionesGateway],
  exports: [NotificacionesGateway],
})
export class NotificacionesModule {}