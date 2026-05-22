#!/usr/bin/env bash
# ============================================================
#  Farmer Tracker — Bootstrap inicial del servidor
#  Se ejecuta UNA SOLA VEZ en la primera instalación.
#  El script deploy.sh lo llama automáticamente.
# ============================================================
set -euo pipefail

APP_DIR="/opt/farmer-tracker"
NGINX_AVAILABLE="/etc/nginx/sites-available/huertos.uideedev.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/huertos.uideedev.com"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
log()  { printf "${G}  ▶ %s${N}\n" "$*"; }
warn() { printf "${Y}  ⚠ %s${N}\n" "$*"; }
err()  { printf "${R}  ✗ %s${N}\n" "$*" >&2; exit 1; }
step() { printf "\n${B}  ━━━ %s ━━━${N}\n" "$*"; }
ok()   { printf "${G}  ✔ %s${N}\n" "$*"; }

cd "$APP_DIR"

# ============================================================
# 1. Docker
# ============================================================
step "Docker"
if ! command -v docker &>/dev/null; then
  log "Instalando Docker…"
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  warn "Docker instalado. Se usará 'sudo docker' en esta sesión."
  DOCKER_CMD="sudo docker"
  COMPOSE_CMD="sudo docker compose"
else
  ok "Docker ya instalado: $(docker --version | cut -d' ' -f3 | tr -d ',')"
  # Comprobar si el usuario está en el grupo docker
  if groups "$USER" | grep -q docker; then
    DOCKER_CMD="docker"
    COMPOSE_CMD="docker compose"
  else
    warn "Usuario no está en el grupo docker. Usando sudo."
    DOCKER_CMD="sudo docker"
    COMPOSE_CMD="sudo docker compose"
  fi
fi

# ============================================================
# 2. Node.js (para build del frontend)
# ============================================================
step "Node.js"
export NVM_DIR="$HOME/.nvm"

if ! command -v node &>/dev/null; then
  log "Instalando Node.js v20 via nvm…"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  # Intentar cargar nvm si node viene de ahí
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  NODE_VER=$(node --version)
  ok "Node.js ya instalado: $NODE_VER"
  # Verificar que es v18+
  NODE_MAJOR=$(node --version | tr -d 'v' | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    warn "Node.js $NODE_VER es demasiado antiguo. Actualizando a v20…"
    nvm install 20 && nvm use 20 && nvm alias default 20
  fi
fi
ok "Node: $(node --version)  npm: $(npm --version)"

# ============================================================
# 3. Crear .env desde .env.example
# ============================================================
step "Configuración .env"
if [ ! -f "$APP_DIR/.env" ]; then
  log "Generando .env con contraseñas aleatorias…"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"

  # Generar valores aleatorios seguros
  SECRET_KEY=$(openssl rand -hex 32)
  DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)

  # Reemplazar en .env
  sed -i "s/changeme_strong_password/${DB_PASS}/g" "$APP_DIR/.env"
  sed -i "s|postgresql://farmer:changeme_strong_password@postgres:5432/farmer_tracker|postgresql://farmer:${DB_PASS}@postgres:5432/farmer_tracker|g" "$APP_DIR/.env"
  sed -i "s/changeme_generate_with_openssl_rand_hex_32/${SECRET_KEY}/" "$APP_DIR/.env"

  ok ".env creado con claves generadas automáticamente"
  warn "Revisa el archivo .env si quieres personalizar algo: nano $APP_DIR/.env"
else
  ok ".env ya existe — no se modifica"
fi

# ============================================================
# 4. Directorios de datos
# ============================================================
step "Directorios"
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/frontend/dist"
ok "uploads/ y frontend/dist/ creados"

# ============================================================
# 5. Build del frontend
# ============================================================
step "Build del frontend"
cd "$APP_DIR/frontend"
log "Instalando dependencias npm…"
npm ci --silent

log "Compilando React…"
npm run build

ok "Build completado → frontend/dist/"
cd "$APP_DIR"

# ============================================================
# 6. Docker Compose — levantar servicios
# ============================================================
step "Docker Compose"
log "Construyendo imagen de la API…"
$COMPOSE_CMD build --no-cache api

log "Levantando servicios (postgres, redis, api)…"
$COMPOSE_CMD up -d

log "Esperando a que la API esté lista…"
MAX_WAIT=60
WAIT=0
until $DOCKER_CMD exec farmer-api wget -qO- http://localhost:8000/api/health &>/dev/null; do
  sleep 3
  WAIT=$((WAIT + 3))
  if [ $WAIT -ge $MAX_WAIT ]; then
    warn "Timeout esperando a la API. Revisa los logs: docker compose logs api"
    break
  fi
  printf "."
done
printf "\n"
ok "API en funcionamiento"

# ============================================================
# 7. Nginx
# ============================================================
step "Nginx"

# Actualizar la ruta del frontend en el config de nginx
NGINX_CONF="$APP_DIR/nginx/huertos.uideedev.com"

# Copiar config de nginx
sudo cp "$NGINX_CONF" "$NGINX_AVAILABLE"
ok "Config copiado a $NGINX_AVAILABLE"

# Crear symlink si no existe
if [ ! -L "$NGINX_ENABLED" ]; then
  sudo ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  ok "Symlink creado en sites-enabled"
else
  ok "Symlink ya existe"
fi

# Verificar sintaxis
sudo nginx -t && ok "Sintaxis Nginx correcta"

# Recargar Nginx
sudo systemctl reload nginx
ok "Nginx recargado"

# ============================================================
# 8. Verificación final
# ============================================================
step "Verificación final"

printf "\n"
$COMPOSE_CMD ps
printf "\n"

log "Estado de los servicios:"
$DOCKER_CMD exec farmer-api wget -qO- http://localhost:8000/api/health 2>/dev/null \
  && ok "API responde correctamente" \
  || warn "La API no responde — revisa: docker compose logs api"

printf "\n"
printf "${G}╔══════════════════════════════════════════════════╗${N}\n"
printf "${G}║  ✔ Farmer Tracker instalado correctamente        ║${N}\n"
printf "${G}║  → http://huertos.uideedev.com                   ║${N}\n"
printf "${G}╚══════════════════════════════════════════════════╝${N}\n"
printf "\n"
printf "  Registro de usuario: abre la app y haz clic en 'Crear cuenta'\n"
printf "  Logs en tiempo real: cd $APP_DIR && docker compose logs -f\n"
printf "  .env con contraseñas: $APP_DIR/.env\n\n"
