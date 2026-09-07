import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { PerfilesTecnicoService } from '../services/perfiles-tecnico.service';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

@Controller('perfiles-tecnico')
export class PerfilesTecnicoController {
  constructor(private readonly perfilesTecnicoService: PerfilesTecnicoService) {}

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePerfilTecnicoDto,
  ) {
    if (user.rol !== RolUsuario.ADMIN) {
      dto.usuario_id = user.id;
    }
    return this.perfilesTecnicoService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.perfilesTecnicoService.findAllPublic();
  }

  @Public()
  @Get(':usuarioId')
  findOne(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.findOnePublic(usuarioId);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Put(':usuarioId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: UpdatePerfilTecnicoDto,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.update(usuarioId, dto);
  }

  @Roles(RolUsuario.ADMIN)
  @Delete(':usuarioId')
  remove(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.remove(usuarioId);
  }

  @Roles(RolUsuario.ADMIN)
  @Post(':usuarioId/verificar')
  verificar(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.verificar(usuarioId);
  }

  @Roles(RolUsuario.ADMIN)
  @Delete(':usuarioId/verificar')
  desverificar(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.desverificar(usuarioId);
  }

  @Roles(RolUsuario.CLIENTE)
  @Post(':usuarioId/calificar')
  calificar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: CalificarPerfilTecnicoDto,
  ) {
    if (usuarioId === user.id) {
      throw new BadRequestException('No puedes calificar tu propio perfil');
    }
    return this.perfilesTecnicoService.calificar(usuarioId, dto);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Post(':usuarioId/servicios-completados')
  registrarServicioCompletado(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.registrarServicioCompletado(usuarioId);
  }

  private asegurarPropioOAdmin(user: AuthenticatedUser, usuarioId: string) {
    if (user.rol !== RolUsuario.ADMIN && usuarioId !== user.id) {
      throw new ForbiddenException('Solo puedes gestionar tu propio perfil');
    }
  }
}
