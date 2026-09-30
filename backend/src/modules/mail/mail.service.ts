import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    return this.configService.get<string>('RESEND_API_KEY') ?? '';
  }

  private get from(): string {
    return (
      this.configService.get<string>('RESEND_FROM') ??
      'CamelloApp <onboarding@resend.dev>'
    );
  }

  async enviarRecuperacion(email: string, nombre: string, link: string): Promise<void> {
    const apiKey = this.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Envío de correos no configurado: define RESEND_API_KEY en el entorno',
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
    const text = `Hola ${nombre}, usa este enlace (válido por 1 hora) para restablecer tu contraseña: ${link}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email],
        subject: 'Recuperación de contraseña — CamelloApp',
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detalle = (await res.text()).slice(0, 300);
      throw new ServiceUnavailableException(
        `Error enviando correo (${res.status}): ${detalle}`,
      );
    }
  }
}