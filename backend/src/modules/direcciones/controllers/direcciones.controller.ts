import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DireccionesService } from '../services/direcciones.service';
import { CreateDireccionDto } from '../dtos/create-direccion.dto';
import { UpdateDireccionDto } from '../dtos/update-direccion.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @Get()
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query('usuario_id') usuarioId?: string,
  ) {
    return this.direccionesService.findAll(this.obtenerUsuarioId(user, usuarioId));
  }

  @Post()
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDireccionDto,
    @Query('usuario_id') usuarioId?: string,
  ) {
    return this.direccionesService.create(this.obtenerUsuarioId(user, usuarioId), dto);
  }

  @Roles(RolUsuario.ADMIN)
  @Get('usuario/:usuarioId')
  listarPorUsuario(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.direccionesService.findAll(usuarioId);
  }

  @Get(':id')
  obtener(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.direccionesService.findOne(this.obtenerUsuarioId(user), id);
  }

  @Put(':id')
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDireccionDto,
  ) {
    return this.direccionesService.update(this.obtenerUsuarioId(user), id, dto);
  }

  @Put(':id/principal')
  establecerPrincipal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.direccionesService.setPrincipal(this.obtenerUsuarioId(user), id);
  }

  @Delete(':id')
  eliminar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.direccionesService.remove(this.obtenerUsuarioId(user), id);
  }

  private obtenerUsuarioId(user: AuthenticatedUser, solicitado?: string) {
    if (user.rol === RolUsuario.ADMIN && solicitado) {
      return solicitado;
    }
    if (solicitado) {
      throw new ForbiddenException('Solo puedes gestionar tus propias direcciones');
    }
    return user.id;
  }
}