import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilTecnico } from './entities/perfil-tecnico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilTecnico])],
})
export class PerfilesTecnicoModule {}