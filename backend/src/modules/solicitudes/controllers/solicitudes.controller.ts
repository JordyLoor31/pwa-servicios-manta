import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SolicitudesService } from '../services/solicitudes.service';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { AceptarSolicitudDto } from '../dtos/aceptar-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

class ConfirmarCodigoDto {
  codigo: string;
}

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Roles(RolUsuario.CLIENTE)
  @Post()
  crear(@CurrentUser() user: AuthenticatedUser, @Body() dto: CrearSolicitudDto) {
    return this.solicitudesService.crear(user.id, dto);
  }

  @Roles(RolUsuario.CLIENTE)
  @Get('mis')
  misSolicitudes(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('estado', new DefaultValuePipe('')) estado: string,
  ) {
    return this.solicitudesService.listarMis(user.id, { page, limit, estado: estado || undefined });
  }

  @Roles(RolUsuario.TECNICO)
  @Get('recibidas')
  recibidas(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('estado', new DefaultValuePipe('')) estado: string,
  ) {
    return this.solicitudesService.listarRecibidas(user.id, { page, limit, estado: estado || undefined });
  }

  @Roles(RolUsuario.ADMIN)
  @Get()
  todas(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('estado', new DefaultValuePipe('')) estado: string,
  ) {
    return this.solicitudesService.listarAdmin({ page, limit, estado: estado || undefined });
  }

  @Get(':id')
  detalle(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.detalle(id, user);
  }

  @Roles(RolUsuario.CLIENTE)
  @Patch(':id/cancelar')
  cancelar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.cancelar(id, user);
  }

  @Roles(RolUsuario.CLIENTE)
  @Get(':id/postulaciones')
  postulaciones(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.listarPostulaciones(id, user);
  }

  @Roles(RolUsuario.TECNICO)
  @Post(':id/postulaciones')
  postular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearPostulacionDto,
  ) {
    return this.solicitudesService.postular(id, dto, user);
  }

  @Roles(RolUsuario.CLIENTE)
  @Patch(':id/postulaciones/:postulacionId/aceptar')
  aceptarPostulacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postulacionId', ParseUUIDPipe) postulacionId: string,
  ) {
    return this.solicitudesService.aceptarPostulacion(id, postulacionId, user);
  }

  @Roles(RolUsuario.CLIENTE)
  @Patch(':id/postulaciones/:postulacionId/rechazar')
  rechazarPostulacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postulacionId', ParseUUIDPipe) postulacionId: string,
  ) {
    return this.solicitudesService.rechazarPostulacion(id, postulacionId, user);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Patch(':id/aceptar')
  aceptar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AceptarSolicitudDto,
  ) {
    return this.solicitudesService.aceptar(id, dto, user);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Patch(':id/rechazar')
  rechazar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarSolicitudDto,
  ) {
    return this.solicitudesService.rechazar(id, dto, user);
  }

  @Roles(RolUsuario.TECNICO, RolUsuario.ADMIN)
  @Patch(':id/completar')
  completar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.completar(id, user);
  }

  @Roles(RolUsuario.TECNICO)
  @Post(':id/iniciar-completacion')
  iniciarCompletacion(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.iniciarCompletacion(id, user);
  }

  @Roles(RolUsuario.CLIENTE)
  @Post(':id/confirmar-completacion')
  confirmarCompletacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarCodigoDto,
  ) {
    return this.solicitudesService.confirmarCompletacion(id, dto.codigo, user);
  }
}