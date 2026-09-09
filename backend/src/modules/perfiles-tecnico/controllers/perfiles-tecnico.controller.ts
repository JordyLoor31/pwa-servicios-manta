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
import { ReemplazarCategoriasDto } from '../dtos/reemplazar-categorias.dto';
import { ReemplazarDisponibilidadDto } from '../dtos/reemplazar-disponibilidad.dto';
import { CrearCertificacionDto } from '../dtos/crear-certificacion.dto';
import { RevisarCertificacionDto } from '../dtos/revisar-certificacion.dto';
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

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Put(':usuarioId/categorias')
  reemplazarCategorias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: ReemplazarCategoriasDto,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.reemplazarCategorias(usuarioId, dto.categoria_ids);
  }

  @Public()
  @Get(':usuarioId/categorias')
  obtenerCategorias(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.obtenerCategorias(usuarioId);
  }

  @Public()
  @Get(':usuarioId/disponibilidad')
  obtenerDisponibilidad(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.obtenerDisponibilidad(usuarioId);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Put(':usuarioId/disponibilidad')
  reemplazarDisponibilidad(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: ReemplazarDisponibilidadDto,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.reemplazarDisponibilidad(usuarioId, dto.disponibilidad);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Delete(':usuarioId/disponibilidad')
  eliminarDisponibilidad(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.eliminarDisponibilidad(usuarioId);
  }

  @Public()
  @Get(':usuarioId/certificaciones')
  obtenerCertificaciones(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.perfilesTecnicoService.obtenerCertificaciones(usuarioId);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Post(':usuarioId/certificaciones')
  agregarCertificacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() dto: CrearCertificacionDto,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.agregarCertificacion(usuarioId, dto);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Delete(':usuarioId/certificaciones/:certificacionId')
  eliminarCertificacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('certificacionId', ParseUUIDPipe) certificacionId: string,
  ) {
    this.asegurarPropioOAdmin(user, usuarioId);
    return this.perfilesTecnicoService.eliminarCertificacion(usuarioId, certificacionId);
  }

  @Roles(RolUsuario.ADMIN)
  @Put(':usuarioId/certificaciones/:certificacionId/revisar')
  revisarCertificacion(
    @Param('certificacionId', ParseUUIDPipe) certificacionId: string,
    @Body() dto: RevisarCertificacionDto,
  ) {
    return this.perfilesTecnicoService.revisarCertificacion(certificacionId, dto);
  }

  private asegurarPropioOAdmin(user: AuthenticatedUser, usuarioId: string) {
    if (user.rol !== RolUsuario.ADMIN && usuarioId !== user.id) {
      throw new ForbiddenException('Solo puedes gestionar tu propio perfil');
    }
  }
}
