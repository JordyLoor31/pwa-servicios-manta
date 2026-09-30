import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'node:net';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) return;

    const options = {
      host,
      port: this.configService.get<number>('SMTP_PORT') ?? 465,
      secure: (this.configService.get<number>('SMTP_PORT') ?? 465) === 465,
      connectionTimeout: 20000,
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
          }
        : undefined,
      getSocket: (
        _transportOptions: unknown,
        callback: (err: Error | null, socket?: { socket: net.Socket }) => void,
      ) => {
        callback(null, { socket: new net.Socket({ family: 4 } as net.SocketConstructorOpts) });
      },
    };
    this.transporter = nodemailer.createTransport(
      options as Parameters<typeof nodemailer.createTransport>[0],
    );
  }

  private get from(): string {
    const from = this.configService.get<string>('SMTP_FROM');
    if (from) return from;
    const user = this.configService.get<string>('SMTP_USER');
    if (user) return user;
    return 'no-reply@serviciosmanta.local';
  }

  async enviarRecuperacion(email: string, nombre: string, link: string): Promise<void> {
    if (!this.transporter) {
      throw new ServiceUnavailableException(
        'Envío de correos no configurado: define SMTP_HOST en el entorno',
      );
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#006D8F;margin:0 0 8px;">Recuperación de contraseña</h2>
        <p style="color:#334155;line-height:1.6;">Hola <strong>${nombre}</strong>, recibimos una solicitud para
        restablecer tu contraseña en CamelloApp.</p>
        <p style="color:#334155;">Este enlace es válido por <strong>1 hora</strong>:</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${link}" style="display:inline-block;background:#006D8F;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Restablecer contraseña</a>
        </p>
        <p style="color:#64748b;font-size:13px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>`;

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Recuperación de contraseña — CamelloApp',
      text: `Hola ${nombre}, usa este enlace (válido por 1 hora) para restablecer tu contraseña: ${link}`,
      html,
    });
  }
}