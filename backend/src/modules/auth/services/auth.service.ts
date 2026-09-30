import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { MailService } from '../../mail/mail.service';
import { LoginDto } from '../dtos/login.dto';
import { GoogleLoginDto } from '../dtos/google-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private readonly EXPIRA_TOKEN_MIN = 5;

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.emisionToken(usuario);
  }

  async googleLogin(dto: GoogleLoginDto) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Login con Google no configurado: define GOOGLE_CLIENT_ID en el entorno',
      );
    }

    const googleClient = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: dto.id_token,
        audience: clientId,
      });
      payload = ticket.getPayload();
      if (!payload) {
        throw new Error('sin payload');
      }
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    const email = payload?.email?.toLowerCase();
    if (!email || !payload.email_verified) {
      throw new UnauthorizedException('La cuenta de Google no tiene un correo verificado');
    }

    let usuario = await this.usuariosService.findByEmail(email);

    if (!usuario) {
      usuario = await this.usuariosService.crearConGoogle({
        nombres: payload.given_name ?? payload.name?.split(' ')[0] ?? email.split('@')[0],
        apellidos:
          payload.family_name ?? payload.name?.split(' ').slice(1).join(' ') ?? '',
        email,
        rol: dto.rol ?? RolUsuario.CLIENTE,
        avatarUrl: payload.picture ?? undefined,
      });
    } else if (usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Tu cuenta está suspendida o inactiva');
    }

    return this.emisionToken(usuario);
  }

  private async emisionToken(usuario: {
    id: string;
    email: string;
    rol: RolUsuario;
    password_hash: string;
  }) {
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const { password_hash, ...publicUser } = usuario;
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: publicUser,
    };
  }

  async solicitarRecuperacion(email: string) {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      return { mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.' };
    }

    const token = randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + this.EXPIRA_TOKEN_MIN * 60 * 1000);
    await this.usuariosService.guardarTokenReset(usuario.id, this.hashToken(token), expira);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new ServiceUnavailableException(
        'FRONTEND_URL no está configurado. Define la URL de la aplicación para generar el enlace.',
      );
    }

    const link = `${frontendUrl.replace(/\/$/, '')}/resetear?token=${token}`;
    await this.mailService.enviarRecuperacion(usuario.email, usuario.nombres, link);

    return { mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.' };
  }

  async restablecerPassword(token: string, nuevaPassword: string) {
    const usuario = await this.usuariosService.buscarPorTokenReset(this.hashToken(token));
    if (
      !usuario ||
      !usuario.reset_token_expira ||
      usuario.reset_token_expira.getTime() < Date.now()
    ) {
      throw new BadRequestException('El enlace de recuperación es inválido o ya expiró.');
    }

    const password_hash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuariosService.aplicarNuevaPassword(usuario.id, password_hash);
    return { mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
}