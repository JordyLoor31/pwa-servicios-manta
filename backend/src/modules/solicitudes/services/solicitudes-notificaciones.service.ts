import { Injectable } from '@nestjs/common';
import { NotificacionesGateway } from '../../notificaciones/notificaciones.gateway';
import { NotificacionesPushService } from '../../notificaciones-push/services/notificaciones-push.service';

@Injectable()
export class SolicitudesNotificacionesService {
  constructor(
    private readonly notificaciones: NotificacionesGateway,
    private readonly notificacionesPush: NotificacionesPushService,
  ) {}

  async nueva(tecnicoId: string, solicitud: Record<string, unknown>) {
    const cliente = solicitud.cliente as { nombres: string; apellidos: string };
    this.notificaciones.notificarNuevaSolicitud(tecnicoId, {
      evento: 'solicitud.nueva',
      solicitud,
    });
    await this.notificacionesPush.enviar(tecnicoId, {
      titulo: 'Nueva solicitud de servicio',
      cuerpo: `${cliente.nombres} ${cliente.apellidos} quiere un servicio.`,
      url: '/solicitudes/recibidas',
    });
  }

  async actualizada(
    usuarioId: string,
    solicitud: Record<string, unknown>,
    titulo: string,
    cuerpo: string,
    url: string,
  ) {
    this.notificaciones.notificarSolicitudActualizada(usuarioId, {
      evento: 'solicitud.actualizada',
      solicitud,
    });
    await this.notificacionesPush.enviar(usuarioId, { titulo, cuerpo, url });
  }
}
