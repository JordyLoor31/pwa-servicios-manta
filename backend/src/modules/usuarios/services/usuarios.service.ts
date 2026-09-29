import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Usuario, RolUsuario, EstadoUsuario } from '../entities/usuario.entity';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';

@Injectable()
export class UsuariosService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async createPublic(createUsuarioDto: CreateUsuarioDto) {
    if (createUsuarioDto.rol === RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede crear cuentas de administrador');
    }
    return this.create(createUsuarioDto);
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const password_hash = await bcrypt.hash(createUsuarioDto.password, this.SALT_ROUNDS);
    const usuario = this.usuariosRepository.create({
      ...createUsuarioDto,
      password_hash,
    });

    try {
      const saved = await this.usuariosRepository.save(usuario);
      return this.sanitize(saved);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  async findOne(id: string) {
    const usuario = await this.usuariosRepository.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return this.sanitize(usuario);
  }

  async findAll(page: number, limit: number, busqueda?: string) {
    const where = busqueda
      ? [
          { nombres: ILike(`%${busqueda}%`) },
          { apellidos: ILike(`%${busqueda}%`) },
          { email: ILike(`%${busqueda}%`) },
        ]
      : undefined;
    const [data, total] = await this.usuariosRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { fecha_registro: 'DESC' },
    });
    return {
      data: data.map((usuario) => this.sanitize(usuario)),
      total,
      page,
      limit,
    };
  }

  async cambiarEstado(id: string, estado: EstadoUsuario) {
    const usuario = await this.usuariosRepository.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.estado = estado;
    const updated = await this.usuariosRepository.save(usuario);
    return this.sanitize(updated);
  }

  async findByEmail(email: string) {
    return this.usuariosRepository.findOneBy({ email });
  }

  async guardarTokenReset(id: string, reset_token_hash: string, reset_token_expira: Date) {
    const usuario = await this.usuariosRepository.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.reset_token_hash = reset_token_hash;
    usuario.reset_token_expira = reset_token_expira;
    await this.usuariosRepository.save(usuario);
    return usuario;
  }

  async buscarPorTokenReset(reset_token_hash: string) {
    return this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect(['usuario.reset_token_hash', 'usuario.reset_token_expira'])
      .where('usuario.reset_token_hash = :hash', { hash: reset_token_hash })
      .getOne();
  }

  async aplicarNuevaPassword(id: string, password_hash: string) {
    const usuario = await this.usuariosRepository.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.password_hash = password_hash;
    usuario.reset_token_hash = null;
    usuario.reset_token_expira = null;
    await this.usuariosRepository.save(usuario);
    return this.sanitize(usuario);
  }

  async actualizarMiPerfil(id: string, datos: { nombres?: string; apellidos?: string; telefono?: string; avatar_url?: string }) {
    const usuario = await this.usuariosRepository.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    if (datos.nombres !== undefined) usuario.nombres = datos.nombres;
    if (datos.apellidos !== undefined) usuario.apellidos = datos.apellidos;
    if (datos.telefono !== undefined) usuario.telefono = datos.telefono;
    if (datos.avatar_url !== undefined) usuario.avatar_url = datos.avatar_url;
    const updated = await this.usuariosRepository.save(usuario);
    return this.sanitize(updated);
  }

  async crearConGoogle(datos: {
    nombres: string;
    apellidos: string;
    email: string;
    rol: RolUsuario;
    avatarUrl?: string;
  }) {
    const password_hash = await bcrypt.hash(randomUUID(), this.SALT_ROUNDS);
    const usuario = this.usuariosRepository.create({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.email,
      password_hash,
      avatar_url: datos.avatarUrl,
      rol: datos.rol,
      estado: EstadoUsuario.ACTIVO,
    });

    try {
      const saved = await this.usuariosRepository.save(usuario);
      return saved;
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        const existente = await this.findByEmail(datos.email);
        if (existente) {
          return existente;
        }
      }
      throw error;
    }
  }

  private sanitize(usuario: Usuario) {
    const { password_hash, ...publicUser } = usuario;
    return publicUser;
  }
}