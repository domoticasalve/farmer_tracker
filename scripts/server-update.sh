#!/usr/bin/env bash
# ============================================================
#  Farmer Tracker — Actualización del servidor
#  Se ejecuta en cada 'deploy.sh' cuando ya existe .env
# ============================================================
set -euo pipefail

APP_DIR="/opt/farmer-tracker"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
log()  { printf "${G}  ▶ %s${N}\n" "$*"; }
warn() { printf "${Y}  ⚠ %s${N}\n" "$*"; }
step() { printf "\n${B}  ━━━ %s ━━━${N}\n" "$*"; }
ok()   { printf "${G}  ✔ %s${N}\n" "$*"; }

cd "$APP_DIR"

# Docker command (con o sin sudo según grupo)
if groups "$USER" | grep -q docker; then
  DOCKER_CMD="docker"; COMPOSE_CMD="docker compose"
else
  DOCKER_CMD="sudo docker"; COMPOSE_CMD="sudo docker compose"
fi

# ============================================================
# 1. Cargar nvm (si Node fue instalado via nvm)
# ============================================================
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# ============================================================
# 2. Detectar qué cambió para saber qué reconstruir
# ============================================================
step "Detectando cambios"

# Checksums actuales
CURRENT_REQUIREMENTS=$(md5sum "$APP_DIR/api/requirements.txt" 2>/dev/null | cut -d' ' -f1 || echo "none")
CURRENT_DOCKERFILE=$(md5sum "$APP_DIR/api/Dockerfile"          2>/dev/null | cut -d' ' -f1 || echo "none")
CURRENT_NGINX=$(md5sum "$APP_DIR/nginx/huertos.uideedev.com"   2>/dev/null | cut -d' ' -f1 || echo "none")
STATE_FILE="$APP_DIR/.deploy-state"

PREV_REQUIREMENTS="none"; PREV_DOCKERFILE="none"; PREV_NGINX="none"
if [ -f "$STATE_FILE" ]; then
  source "$STATE_FILE"
fi

REBUILD_API=false
REBUILD_FRONTEND=true  # siempre rebuild frontend (rápido y seguro)
RELOAD_NGINX=false

if [ "$CURRENT_REQUIREMENTS" != "$PREV_REQUIREMENTS" ] || \
   [ "$CURRENT_DOCKERFILE"   != "$PREV_DOCKERFILE" ]; then
  REBUILD_API=true
  log "Cambios detectados en API (Dockerfile o requirements.txt)"
fi

if [ "$CURRENT_NGINX" != "$PREV_NGINX" ]; then
  RELOAD_NGINX=true
  log "Cambios detectados en configuración Nginx"
fi

# ============================================================
# 3. Build frontend
# ============================================================
step "Build del frontend"
cd "$APP_DIR/frontend"

# npm ci solo si package-lock.json cambió
log "Verificando dependencias npm…"
npm ci --silent

log "Compilando React…"
npm run build
ok "Build completado"
cd "$APP_DIR"

# ============================================================
# 4. Reconstruir API si hace falta
# ============================================================
step "Docker Compose"

if $REBUILD_API; then
  log "Reconstruyendo imagen de la API (cambios en dependencias)…"
  $COMPOSE_CMD build api
fi

log "Reiniciando servicios…"
$COMPOSE_CMD up -d --remove-orphans

# Esperar a que la API esté sana
log "Esperando a que la API esté lista…"
MAX_WAIT=45; WAIT=0
until $DOCKER_CMD exec farmer-api wget -qO- http://localhost:8000/api/health &>/dev/null; do
  sleep 3; WAIT=$((WAIT + 3))
  [ $WAIT -ge $MAX_WAIT ] && { warn "Timeout — revisa: docker compose logs api"; break; }
  printf "."
done
printf "\n"
ok "API en funcionamiento"

# ============================================================
# 5. Nginx (solo si el config cambió)
# ============================================================
if $RELOAD_NGINX; then
  step "Nginx — aplicando nueva configuración"
  sudo cp "$APP_DIR/nginx/huertos.uideedev.com" /etc/nginx/sites-available/huertos.uideedev.com
  sudo nginx -t && sudo systemctl reload nginx
  ok "Nginx recargado con nuevo config"
else
  ok "Config Nginx sin cambios — no se recarga"
fi

# ============================================================
# 6. Guardar estado para próxima ejecución
# ============================================================
cat > "$STATE_FILE" <<EOF
PREV_REQUIREMENTS="$CURRENT_REQUIREMENTS"
PREV_DOCKERFILE="$CURRENT_DOCKERFILE"
PREV_NGINX="$CURRENT_NGINX"
EOF

# ============================================================
# 7. Resumen
# ============================================================
step "Actualización completada"
printf "\n"
$COMPOSE_CMD ps
printf "\n"
printf "${G}✔ Actualización desplegada correctamente${N}\n"
printf "  → http://huertos.uideedev.com\n\n"
