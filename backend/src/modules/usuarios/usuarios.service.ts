import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

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

  async findByEmail(email: string) {
    return this.usuariosRepository.findOneBy({ email });
  }

  private sanitize(usuario: Usuario) {
    const { password_hash, ...publicUser } = usuario;
    return publicUser;
  }
}