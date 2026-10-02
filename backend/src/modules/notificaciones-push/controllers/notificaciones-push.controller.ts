import { Body, Controller, Delete, Post } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { NotificacionesPushService } from '../services/notificaciones-push.service';
import { SuscripcionPushDto } from '../dtos/suscripcion-push.dto';

@Controller('notificaciones-push')
export class NotificacionesPushController {
  constructor(private readonly notificacionesPushService: NotificacionesPushService) {}

  @Post('suscripcion')
  guardarSuscripcion(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuscripcionPushDto) {
    return this.notificacionesPushService.guardarSuscripcion(user.id, dto);
  }

  @Delete('suscripcion')
  eliminarSuscripcion(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuscripcionPushDto) {
    return this.notificacionesPushService.eliminarSuscripcion(user.id, dto.endpoint);
  }
}