import { Module } from '@nestjs/common';
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

@Module({
  imports: [UsuariosModule, PerfilesTecnicoModule, CategoriasModule, DireccionesModule, SolicitudesModule, PagosModule, ChatModule, NotificacionesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
