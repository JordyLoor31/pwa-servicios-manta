# PWA Servicios de Manta

Plataforma de contratación de servicios técnicos en Manta. Backend en **NestJS** (PostgreSQL/TypeORM) y frontend **Vue 3 + Vite** (PWA).

## Estructura

```
pwa-servicios-manta/
├── backend/          # API NestJS (TypeORM + PostgreSQL)
├── frontend/         # SPA Vue 3 + Vite (PWA)
├── docker-compose.yml
├── .env.example      # Variables de entorno de docker-compose
└── SECURITY-README.md  # Medidas de seguridad (local, ignorado)
```

## Requisitos

- Node.js 22
- pnpm (`corepack enable`)
- Docker + Docker Compose (opcional, para el modo contenedores)

---

## Ejecutar con Docker

### Desarrollo (mode watch)

Levanta los 3 servicios: backend (`:3000`), postgres y frontend (`:5173`) con hot-reload (`Dockerfile.dev`).

```bash
# Variables opcionales (con defaults de desarrollo)
cp .env.example .env   # DB_USER, DB_PASS, DB_NAME

docker compose up --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- PostgreSQL: `127.0.0.1:5432` (solo accesible desde localhost)

Al actualizar `docker-compose.yml` o los `Dockerfile.dev`, reconstruir con `docker compose up --build`.

### Producción (imágenes optimizadas multi-stage)

Los `Dockerfile.prod` generan imágenes livianas (solo lo necesario para ejecutar):

| Imagen | Modo dev | Modo prod |
|--------|----------|-----------|
| backend | 1.07 GB | 404 MB |
| frontend | 828 MB | 106 MB |

```bash
# Backend: requiere JWT_SECRET y CORS_ORIGINS en producción (fail-fast si faltan)
docker build -f backend/Dockerfile.prod -t pwa-servicios-manta-backend:prod backend/

docker run -d --name backend -p 3000:3000 \
  -e DB_HOST=postgres -e DB_PORT=5432 \
  -e DB_USER=$DB_USER -e DB_PASS=$DB_PASS -e DB_NAME=$DB_NAME \
  -e JWT_SECRET=<secreto_fuerte> \
  -e CORS_ORIGINS=https://tu-dominio.com \
  pwa-servicios-manta-backend:prod

# Frontend: build estático servido por nginx
docker build -f frontend/Dockerfile.prod -t pwa-servicios-manta-frontend:prod \
  --build-arg VITE_API_URL=http://localhost:3000 frontend/

docker run -d --name frontend -p 80:80 pwa-servicios-manta-frontend:prod
```

> El frontend embebe `VITE_API_URL` en el build con `--build-arg`. El despliegue de producción debería estar detrás de HTTPS.

---

## Ejecutar localmente (sin Docker)

### 1. Base de datos

Necesitas PostgreSQL 16 en ejecución. Crea la base:

```sql
CREATE USER servicios_manta WITH PASSWORD 'servicios_manta_2024';
CREATE DATABASE servicios_manta OWNER servicios_manta;
```

### 2. Backend

```bash
cd backend
pnpm install

cp .env.example .env   # configurar DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` / `DB_PORT` | Conexión a PostgreSQL | `localhost` / `5432` |
| `DB_USER` / `DB_PASS` / `DB_NAME` | Credenciales de la base | `servicios_manta` |
| `JWT_SECRET` | Secreto de firma de tokens (generar con `openssl rand -hex 48`) | requerido en prod |
| `JWT_EXPIRES_IN` | Vigencia del token | `7d` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | — |

Ejecutar migraciones y levantar el servidor:

```bash
pnpm run migration:run   # aplica las migraciones de base de datos
pnpm run start:dev       # modo desarrollo (watch)
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Frontend disponible en http://localhost:5173 (usa `VITE_API_URL`, por defecto `http://localhost:3000`).

---

## Scripts útiles

### Backend (`backend/`)

| Comando | Descripción |
|---------|-------------|
| `pnpm run start:dev` | Servidor con watch |
| `pnpm run build` | Compilar a `dist/` |
| `pnpm run start:prod` | Ejecutar build de producción |
| `pnpm run lint` | Lint (oxlint) |
| `pnpm test` | Tests unitarios |
| `pnpm run migration:generate` | Generar migración desde las entidades |
| `pnpm run migration:run` / `migration:revert` | Aplicar / revertir migraciones |

### Frontend (`frontend/`)

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | Build de producción (vue-tsc + vite) |
| `pnpm run preview` | Previsualizar el build |

---

## Puertos

| Servicio | Puerto |
|----------|--------|
| Backend API | `3000` |
| Frontend dev | `5173` |
| PostgreSQL | `5432` (solo localhost en docker) |