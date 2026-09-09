import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { TarifasCategoriaService } from '../services/tarifas-categoria.service';
import { CreateTarifaCategoriaDto } from '../dtos/create-tarifa-categoria.dto';
import { UpdateTarifaCategoriaDto } from '../dtos/update-tarifa-categoria.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

@Controller('tarifas-categoria')
export class TarifasCategoriaController {
  constructor(private readonly tarifasCategoriaService: TarifasCategoriaService) {}

  @Roles(RolUsuario.ADMIN)
  @Post()
  create(@Body() dto: CreateTarifaCategoriaDto) {
    return this.tarifasCategoriaService.create(dto);
  }

  @Roles(RolUsuario.ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.tarifasCategoriaService.findAllAdmin();
  }

  @Public()
  @Get()
  findAll() {
    return this.tarifasCategoriaService.findAll();
  }

  @Public()
  @Get('categoria/:categoriaId')
  findByCategoria(@Param('categoriaId', ParseUUIDPipe) categoriaId: string) {
    return this.tarifasCategoriaService.findByCategoria(categoriaId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tarifasCategoriaService.findOne(id);
  }

  @Roles(RolUsuario.ADMIN)
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTarifaCategoriaDto) {
    return this.tarifasCategoriaService.update(id, dto);
  }

  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tarifasCategoriaService.remove(id);
  }
}