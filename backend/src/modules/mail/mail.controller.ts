import { BadRequestException, Controller, Get, InternalServerErrorException, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

@Controller('mail')
export class MailController {
  constructor(private readonly configService: ConfigService) {}

  private get redirectUri(): string {
    return (
      this.configService.get<string>('GMAIL_REDIRECT_URI') ??
      'http://localhost:3000/mail/gmail/callback'
    );
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Get('gmail/auth-url')
  authUrl() {
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GMAIL_SEND_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Get('gmail/callback')
  async callback(@Query('code') code?: string) {
    if (!code) {
      throw new BadRequestException(
        `Código de autorización no recibido (revisa el parámetro 'error' en la URL)`,
      );
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
        client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.refresh_token) {
      throw new InternalServerErrorException(
        `Error intercambiando el código: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }

    return {
      ok: true,
      refresh_token: data.refresh_token,
      scope: data.scope,
      nota: 'Copia GMAIL_REFRESH_TOKEN al .env (local) y al entorno de Render.',
    };
  }
}