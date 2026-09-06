import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { PerfilesTecnicoService } from '../services/perfiles-tecnico.service';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';

@Controller('perfiles-tecnico')
export class PerfilesTecnicoController {
  constructor(private readonly perfilesTecnicoService: PerfilesTecnicoService) {}

  @Post()
  create(@Body() dto: CreatePerfilTecnicoDto) {
    return this.perfilesTecnicoService.create(dto);
  }

  @Get()
  findAll() {
    return this.perfilesTecnicoService.findAll();
  }

  @Get(':usuarioId')
  findOne(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.findOne(usuarioId);
  }

  @Put(':usuarioId')
  update(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: UpdatePerfilTecnicoDto,
  ) {
    return this.perfilesTecnicoService.update(usuarioId, dto);
  }

  @Delete(':usuarioId')
  remove(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.remove(usuarioId);
  }

  @Post(':usuarioId/verificar')
  verificar(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.verificar(usuarioId);
  }

  @Delete(':usuarioId/verificar')
  desverificar(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.desverificar(usuarioId);
  }

  @Post(':usuarioId/calificar')
  calificar(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: CalificarPerfilTecnicoDto,
  ) {
    return this.perfilesTecnicoService.calificar(usuarioId, dto);
  }

  @Post(':usuarioId/servicios-completados')
  registrarServicioCompletado(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.registrarServicioCompletado(usuarioId);
  }
}