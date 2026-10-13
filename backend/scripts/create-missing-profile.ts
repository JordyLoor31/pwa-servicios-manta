import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const databaseUrl = process.env.DATABASE_URL;

const base = {
  type: 'postgres' as const,
  entities: [
    'src/modules/**/entities/*.entity.ts',
  ],
};

const ds = new DataSource(
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

async function createProfile() {
  try {
    await ds.initialize();
    console.log('Conectado a la base de datos');

    const result = await ds.query(`
      INSERT INTO perfiles_tecnico (usuario_id, verificado, calificacion_promedio, total_servicios_completados)
      VALUES ('7efe3304-d5d6-403b-9824-26d2643213f5', false, 0, 0)
      ON CONFLICT (usuario_id) DO NOTHING
      RETURNING usuario_id;
    `);

    if (result.length > 0) {
      console.log('Perfil técnico creado exitosamente');
    } else {
      console.log('El perfil ya existe');
    }

    await ds.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createProfile();