import { Module } from '@nestjs/common';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { SolicitudesService } from './services/solicitudes.service';

@Module({
  controllers: [SolicitudesController],
  providers: [SolicitudesService]
})
export class SolicitudesModule {}
