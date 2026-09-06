import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { PerfilesTecnicoService } from '../services/perfiles-tecnico.service';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

@Controller('perfiles-tecnico')
export class PerfilesTecnicoController {
  constructor(private readonly perfilesTecnicoService: PerfilesTecnicoService) {}

  @Roles(RolUsuario.TECNICO)
  @Post()
  create(@Body() dto: CreatePerfilTecnicoDto) {
    return this.perfilesTecnicoService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.perfilesTecnicoService.findAll();
  }

  @Public()
  @Get(':usuarioId')
  findOne(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.findOne(usuarioId);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Put(':usuarioId')
  update(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: UpdatePerfilTecnicoDto,
  ) {
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
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: CalificarPerfilTecnicoDto,
  ) {
    return this.perfilesTecnicoService.calificar(usuarioId, dto);
  }

  @Roles(RolUsuario.TECNICO)
  @Post(':usuarioId/servicios-completados')
  registrarServicioCompletado(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.registrarServicioCompletado(usuarioId);
  }
}