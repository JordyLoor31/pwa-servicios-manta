import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { LoginDto } from '../dtos/login.dto';
import { GoogleLoginDto } from '../dtos/google-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
}