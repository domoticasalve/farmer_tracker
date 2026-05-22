# 🌱 Farmer Tracker

App web PWA para la gestión inteligente de huertos. Genera calendarios de tareas automáticos (siembra, riego, cosecha) ajustados a la previsión meteorológica real de la ubicación del huerto.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Base de datos | PostgreSQL 16 (Docker) |
| Caché | Redis 7 (Docker) |
| Clima | [Open-Meteo](https://open-meteo.com/) (gratuito, sin API key) |
| Geocodificación | [Nominatim/OSM](https://nominatim.org/) (gratuito) |
| Despliegue | Docker Compose + Nginx |

## Funcionalidades

- **Múltiples huertos** con foto de portada y ubicación geográfica
- **Catálogo de plantas** (10 plantas de seed, ampliable)
- **Calendario automático** de tareas por ciclo de cada planta
- **Ajuste climático**: los riegos se saltan automáticamente si se prevé lluvia
- **Alertas de helada** para proteger plantas sensibles
- **Registro fotográfico** por planta con visor lightbox
- **PWA installable** en móvil desde el navegador

## Instalación rápida (servidor Ubuntu)

### Pre-requisitos
- Ubuntu 20.04+ con acceso SSH
- Nginx instalado (`sudo apt install nginx`)

### Deploy

```bash
# Clonar el repositorio
git clone https://github.com/domoticasalve/farmer_tracker
cd farmer_tracker

# Primera instalación en el servidor
REMOTE_HOST=ip-de-tu-servidor REMOTE_USER=tu-usuario ./deploy.sh
```

El script de bootstrap instala Docker y Node.js si no están presentes, genera contraseñas seguras, compila el frontend y configura Nginx automáticamente.

### Actualizar

```bash
REMOTE_HOST=ip-de-tu-servidor ./deploy.sh
```

### Con Makefile

```bash
# Deploy
make deploy REMOTE_HOST=ip-de-tu-servidor

# Ver logs
make logs REMOTE_HOST=ip-de-tu-servidor

# Backup de la BD
make backup-db REMOTE_HOST=ip-de-tu-servidor

# Todos los comandos disponibles
make help
```

## Configuración (.env)

Copia `.env.example` a `.env` y edita los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `SECRET_KEY` | Clave JWT (genera con `openssl rand -hex 32`) |
| `CORS_ORIGIN` | URL pública de la app (ej: `http://huertos.midominio.com`) |

> El script de bootstrap genera estos valores automáticamente en la primera instalación.

## Gestión en el servidor

```bash
# Estado de los servicios
bash /opt/farmer-tracker/scripts/manage.sh status

# Logs en tiempo real
bash /opt/farmer-tracker/scripts/manage.sh logs

# Backup de la base de datos
bash /opt/farmer-tracker/scripts/manage.sh backup

# Todos los comandos
bash /opt/farmer-tracker/scripts/manage.sh help
```

## Estructura del proyecto

```
farmer_tracker/
├── api/                    # Backend FastAPI
│   ├── core/               # Config, DB, seguridad
│   ├── models/             # Modelos SQLAlchemy
│   ├── schemas/            # Schemas Pydantic
│   ├── routers/            # Endpoints REST
│   └── services/           # Clima, geocodificación, calendario
├── frontend/               # React + Vite (PWA)
│   └── src/
│       ├── api/            # Clientes fetch
│       ├── components/     # Componentes reutilizables
│       ├── pages/          # Vistas
│       ├── stores/         # Zustand
│       └── types/          # TypeScript types
├── nginx/                  # Config virtual host
├── scripts/                # Scripts de deploy y gestión
├── docker-compose.yml
├── .env.example
├── deploy.sh               # Script de deploy principal
└── Makefile                # Comandos de conveniencia
```

## API

La documentación interactiva está disponible en `/api/docs` cuando `ENVIRONMENT != production`.

## Licencia

MIT
