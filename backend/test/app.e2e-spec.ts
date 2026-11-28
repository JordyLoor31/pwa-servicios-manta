import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/controllers/auth.controller';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { MailService } from '../src/modules/mail/mail.service';
import { SolicitudesController } from '../src/modules/solicitudes/controllers/solicitudes.controller';
import { UsuariosController } from '../src/modules/usuarios/controllers/usuarios.controller';
import { EstadoUsuario, RolUsuario } from '../src/modules/usuarios/entities/usuario.entity';
import { SolicitudesService } from './support/solicitudes.service';
import { UsuariosService } from './support/usuarios.service';

const JWT_SECRET = 'test-only-secret';
const CATEGORY_ID = '19e1567c-8a5e-4058-9079-c349aaf2d590';

describe('Backend e2e', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const usuariosPorEmail = new Map<
      string,
      {
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        password_hash: string;
        rol: RolUsuario;
        estado: EstadoUsuario;
      }
    >();
    const usuariosService = {
      createPublic: async (dto: {
        nombres: string;
        apellidos: string;
        email: string;
        password: string;
        rol: RolUsuario;
      }) => {
        const usuario = {
          id: randomUUID(),
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          email: dto.email,
          password_hash: await bcrypt.hash(dto.password, 10),
          rol: dto.rol,
          estado: EstadoUsuario.ACTIVO,
        };
        usuariosPorEmail.set(usuario.email, usuario);
        const { password_hash: _passwordHash, ...usuarioPublico } = usuario;
        return usuarioPublico;
      },
      findByEmail: async (email: string) => usuariosPorEmail.get(email),
      asegurarPerfilTecnico: async () => undefined,
    };

    const solicitudesService = {
      crear: async (clienteId: string, dto: Record<string, unknown>) => ({
        id: randomUUID(),
        cliente_id: clienteId,
        ...dto,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: JWT_SECRET })],
      controllers: [AuthController, UsuariosController, SolicitudesController],
      providers: [
        { provide: UsuariosService, useValue: usuariosService },
        {
          provide: AuthService,
          useFactory: (
            usuarios: UsuariosService,
            jwt: JwtService,
            config: ConfigService,
            mail: MailService,
          ) => new AuthService(usuarios, jwt, config, mail),
          inject: [UsuariosService, JwtService, ConfigService, MailService],
        },
        { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET }) },
        { provide: MailService, useValue: {} },
        { provide: SolicitudesService, useValue: solicitudesService },
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector, jwt: JwtService) =>
            new JwtAuthGuard(reflector, jwt),
          inject: [Reflector, JwtService],
        },
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new RolesGuard(reflector),
          inject: [Reflector],
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function registerAndLogin(email: string) {
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombres: 'Cliente',
        apellidos: 'E2E',
        email,
        password: 'password-segura-123',
        rol: RolUsuario.CLIENTE,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password-segura-123' })
      .expect(201);

    return response.body.access_token as string;
  }

  it('registra una cuenta e inicia sesión', async () => {
    const email = `registro-${randomUUID()}@example.com`;
    const registro = await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombres: 'Cliente',
        apellidos: 'E2E',
        email,
        password: 'password-segura-123',
        rol: RolUsuario.CLIENTE,
      })
      .expect(201);

    expect(registro.body.email).toBe(email);
    expect(registro.body).not.toHaveProperty('password_hash');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password-segura-123' })
      .expect(201);

    expect(login.body.access_token).toEqual(expect.any(String));
    expect(login.body.user.email).toBe(email);
  });

  it('crea una solicitud para un cliente autenticado', async () => {
    const token = await registerAndLogin(`solicitud-${randomUUID()}@example.com`);
    const response = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        descripcion: 'Reparar una fuga en la cocina',
        categoria_ids: [CATEGORY_ID],
        tipos_servicio: ['Reparación'],
      })
      .expect(201);

    expect(response.body.cliente_id).toEqual(expect.any(String));
    expect(response.body.descripcion).toBe('Reparar una fuga en la cocina');
  });

  it('deniega al cliente el acceso a la lista administrativa de solicitudes', async () => {
    const token = await registerAndLogin(`rol-${randomUUID()}@example.com`);

    await request(app.getHttpServer())
      .get('/solicitudes')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
