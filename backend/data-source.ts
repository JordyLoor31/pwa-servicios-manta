import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Usuario } from './src/modules/usuarios/entities/usuario.entity';
import { PerfilTecnico } from './src/modules/perfiles-tecnico/entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from './src/modules/perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { CertificacionTecnico } from './src/modules/perfiles-tecnico/entities/certificacion-tecnico.entity';
import { Categoria } from './src/modules/categorias/entities/categoria.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Usuario, PerfilTecnico, DisponibilidadTecnico, CertificacionTecnico, Categoria],
  migrations: ['src/migrations/*.ts'],
});
