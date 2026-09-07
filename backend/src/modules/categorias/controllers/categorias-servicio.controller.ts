import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CategoriasServicioService } from '../services/categorias-servicio.service';
import { CreateCategoriaServicioDto } from '../dtos/create-categoria-servicio.dto';
import { UpdateCategoriaServicioDto } from '../dtos/update-categoria-servicio.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

@Controller('categorias-servicio')
export class CategoriasServicioController {
  constructor(private readonly categoriasServicioService: CategoriasServicioService) {}

  @Roles(RolUsuario.ADMIN)
  @Post()
  create(@Body() dto: CreateCategoriaServicioDto) {
    return this.categoriasServicioService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query('soloActivas', new ParseBoolPipe({ optional: true })) soloActivas = false) {
    return this.categoriasServicioService.findAll(soloActivas);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasServicioService.findOne(id);
  }

  @Roles(RolUsuario.ADMIN)
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoriaServicioDto) {
    return this.categoriasServicioService.update(id, dto);
  }

  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasServicioService.remove(id);
  }
}