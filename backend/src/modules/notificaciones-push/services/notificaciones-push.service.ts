import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import webpush from 'web-push';
import { SuscripcionPush } from '../entities/suscripcion-push.entity';
import { SuscripcionPushDto } from '../dtos/suscripcion-push.dto';

export interface NotificacionPushPayload {
  titulo: string;
  cuerpo?: string;
  url?: string;
}

@Injectable()
export class NotificacionesPushService {
  private readonly logger = new Logger(NotificacionesPushService.name);
  private readonly configurado: boolean;

  constructor(
    config: ConfigService,
    @InjectRepository(SuscripcionPush)
    private readonly suscripcionesRepository: Repository<SuscripcionPush>,
  ) {
    const subject = config.get<string>('VAPID_SUBJECT');
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    this.configurado = Boolean(subject && publicKey && privateKey);
    if (this.configurado) {
      webpush.setVapidDetails(subject!, publicKey!, privateKey!);
    } else {
      this.logger.warn('VAPID no configurado: las notificaciones push estan desactivadas');
    }
  }

  async guardarSuscripcion(usuarioId: string, dto: SuscripcionPushDto) {
    const existente = await this.suscripcionesRepository.findOneBy({
      usuario_id: usuarioId,
      endpoint: dto.endpoint,
    });
    if (existente) {
      if (existente.p256dh !== dto.p256dh || existente.auth_key !== dto.auth) {
        await this.suscripcionesRepository.update(existente.id, {
          p256dh: dto.p256dh,
          auth_key: dto.auth,
        });
      }
      return existente;
    }
    const guardada = this.suscripcionesRepository.create({
      usuario_id: usuarioId,
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      auth_key: dto.auth,
    });
    return this.suscripcionesRepository.save(guardada);
  }

  async eliminarSuscripcion(usuarioId: string, endpoint: string) {
    await this.suscripcionesRepository.delete({ usuario_id: usuarioId, endpoint });
  }

  async enviar(usuarioId: string, payload: NotificacionPushPayload) {
    if (!this.configurado) return;
    const suscripciones = await this.suscripcionesRepository.findBy({ usuario_id: usuarioId });
    const cuerpo = JSON.stringify(payload);

    for (const suscripcion of suscripciones) {
      try {
        await webpush.sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: {
              p256dh: suscripcion.p256dh,
              auth: suscripcion.auth_key,
            },
          },
          cuerpo,
        );
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await this.suscripcionesRepository.delete({ id: suscripcion.id });
          continue;
        }
        this.logger.debug(
          `Error al enviar push a ${suscripcion.endpoint}: ${(error as Error)?.message}`,
        );
      }
    }
  }
}