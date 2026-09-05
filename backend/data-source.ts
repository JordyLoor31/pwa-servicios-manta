import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Usuario } from './src/modules/usuarios/entities/usuario.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Usuario],
  migrations: ['src/migrations/*.ts'],
});
