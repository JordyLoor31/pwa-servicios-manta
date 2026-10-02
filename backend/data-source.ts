import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Usuario } from './src/modules/usuarios/entities/usuario.entity';
import { PerfilTecnico } from './src/modules/perfiles-tecnico/entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from './src/modules/perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { CertificacionTecnico } from './src/modules/perfiles-tecnico/entities/certificacion-tecnico.entity';
import { TecnicoCategoria } from './src/modules/perfiles-tecnico/entities/tecnico-categoria.entity';
import { TarifaTecnico } from './src/modules/perfiles-tecnico/entities/tarifa-tecnico.entity';
import { CategoriaServicio } from './src/modules/categorias/entities/categoria-servicio.entity';
import { Direccion } from './src/modules/direcciones/entities/direccion.entity';
import { Solicitud } from './src/modules/solicitudes/entities/solicitud.entity';
import { SuscripcionPush } from './src/modules/notificaciones-push/entities/suscripcion-push.entity';

config();

const databaseUrl = process.env.DATABASE_URL;

const base = {
  type: 'postgres' as const,
  entities: [
    Usuario,
    PerfilTecnico,
    DisponibilidadTecnico,
    CertificacionTecnico,
    TecnicoCategoria,
    TarifaTecnico,
    CategoriaServicio,
    Direccion,
    Solicitud,
    SuscripcionPush,
  ],
  migrations: ['src/migrations/*.ts'],
};

export default new DataSource(
  databaseUrl
    ? {
        ...base,
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        ...base,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      },
);
