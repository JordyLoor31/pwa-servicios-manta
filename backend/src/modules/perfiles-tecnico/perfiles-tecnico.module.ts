import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilTecnico } from './entities/perfil-tecnico.entity';
import { PerfilesTecnicoController } from './perfiles-tecnico.controller';
import { PerfilesTecnicoService } from './perfiles-tecnico.service';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilTecnico])],
  controllers: [PerfilesTecnicoController],
  providers: [PerfilesTecnicoService],
  exports: [PerfilesTecnicoService],
})
export class PerfilesTecnicoModule {}