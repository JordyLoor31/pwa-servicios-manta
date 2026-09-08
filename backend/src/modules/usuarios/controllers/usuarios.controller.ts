import { Controller, ForbiddenException, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { UsuariosService } from '../services/usuarios.service';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.createPublic(createUsuarioDto);
  }

  @Roles(RolUsuario.ADMIN)
  @Post('admin')
  createAdmin(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (user.rol !== RolUsuario.ADMIN && id !== user.id) {
      throw new ForbiddenException('Solo puedes consultar tu propio perfil');
    }
    return this.usuariosService.findOne(id);
  }
}
