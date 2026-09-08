import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';

const DEV_JWT_SECRET = 'servicios-manta-secret-dev';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (isProduction && (!secret || secret === DEV_JWT_SECRET)) {
          throw new Error(
            'JWT_SECRET inválido en producción: define un secreto fuerte en las variables de entorno',
          );
        }

        return {
          secret: secret ?? DEV_JWT_SECRET,
          signOptions: {
            expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}