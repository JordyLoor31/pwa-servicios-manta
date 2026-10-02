import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface UsuarioSocket {
  id: string;
  email: string;
  rol: string;
}

interface SolicitudNotificacionPayload {
  evento: 'solicitud.nueva' | 'solicitud.actualizada';
  solicitud: Record<string, unknown>;
}

const USUARIOS_CONECTADOS = new Map<string, Set<Socket>>();

@Injectable()
@WebSocketGateway({
  namespace: '/notificaciones',
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
})
export class NotificacionesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: Socket) {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    if (!token) {
      socket.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        rol: string;
      }>(token);
      const usuario: UsuarioSocket = {
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
      };
      socket.data.usuario = usuario;
      const sockets = USUARIOS_CONECTADOS.get(usuario.id) ?? new Set<Socket>();
      sockets.add(socket);
      USUARIOS_CONECTADOS.set(usuario.id, sockets);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const usuario = socket.data.usuario as UsuarioSocket | undefined;
    if (!usuario) return;
    const sockets = USUARIOS_CONECTADOS.get(usuario.id);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) {
      USUARIOS_CONECTADOS.delete(usuario.id);
    }
  }

  notificarNuevaSolicitud(tecnicoId: string, payload: SolicitudNotificacionPayload) {
    this.emitirAUsuario(tecnicoId, 'solicitud.nueva', payload);
  }

  notificarSolicitudActualizada(clienteId: string, payload: SolicitudNotificacionPayload) {
    this.emitirAUsuario(clienteId, 'solicitud.actualizada', payload);
  }

  private emitirAUsuario(usuarioId: string, evento: string, payload: unknown) {
    const sockets = USUARIOS_CONECTADOS.get(usuarioId);
    if (!sockets) return;
    for (const socket of sockets) {
      socket.emit(evento, payload);
    }
  }
}