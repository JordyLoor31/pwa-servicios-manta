import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface SendResponse {
  id?: string;
  error?: { message?: string; code?: number };
}

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private get clientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
  }

  private get clientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
  }

  private get refreshToken(): string {
    return this.configService.get<string>('GMAIL_REFRESH_TOKEN') ?? '';
  }

  private get user(): string {
    return this.configService.get<string>('GMAIL_USER') ?? '';
  }

  private get from(): string {
    const name = this.configService.get<string>('GMAIL_SENDER_NAME') ?? 'CamelloApp';
    return `${name} <${this.user}>`;
  }

  async enviarRecuperacion(email: string, nombre: string, link: string): Promise<void> {
    if (!this.clientSecret || !this.refreshToken || !this.user) {
      throw new ServiceUnavailableException(
        'Envío de correos no configurado: define GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN y GMAIL_USER',
      );
    }

    const accessToken = await this.obtenerAccessToken();

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

    const raw = [
      `From: ${this.from}`,
      `To: ${email}`,
      'Subject: Recuperación de contraseña — CamelloApp',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: Buffer.from(raw).toString('base64url') }),
      },
    );

    const data: SendResponse = await res.json().catch(() => ({}));
    if (!res.ok || !data.id) {
      throw new ServiceUnavailableException(
        `Error enviando correo (${res.status}): ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
  }

  private async obtenerAccessToken(): Promise<string> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data: TokenResponse = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new ServiceUnavailableException(
        `Error de autenticación con Gmail (${res.status}): ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
    return data.access_token;
  }
}