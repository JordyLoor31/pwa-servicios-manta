import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PerfilesTecnicoModule } from './modules/perfiles-tecnico/perfiles-tecnico.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { DireccionesModule } from './modules/direcciones/direcciones.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { AuthModule } from './modules/auth/auth.module';
import { Usuario } from './modules/usuarios/entities/usuario.entity';
import { PerfilTecnico } from './modules/perfiles-tecnico/entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from './modules/perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { CertificacionTecnico } from './modules/perfiles-tecnico/entities/certificacion-tecnico.entity';
import { TecnicoCategoria } from './modules/perfiles-tecnico/entities/tecnico-categoria.entity';
import { CategoriaServicio } from './modules/categorias/entities/categoria-servicio.entity';
import { TarifaCategoria } from './modules/categorias/entities/tarifa-categoria.entity';
import { Direccion } from './modules/direcciones/entities/direccion.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [Usuario, PerfilTecnico, DisponibilidadTecnico, CertificacionTecnico, TecnicoCategoria, CategoriaServicio, TarifaCategoria, Direccion],
        synchronize: false,
      }),
    }),
    UsuariosModule,
    AuthModule,
    PerfilesTecnicoModule,
    CategoriasModule,
    DireccionesModule,
    SolicitudesModule,
    PagosModule,
    ChatModule,
    NotificacionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
