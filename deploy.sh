#!/usr/bin/env bash
# ============================================================
#  Farmer Tracker — Script de deploy principal
#  Uso: REMOTE_HOST=tu-ip ./deploy.sh
#       REMOTE_HOST=tu-ip REMOTE_USER=tu-usuario ./deploy.sh
# ============================================================
set -euo pipefail

# ---- Configuración -------------------------------------------
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_HOST="${REMOTE_HOST:?❌ Debes indicar el servidor: REMOTE_HOST=tu-ip ./deploy.sh}"
REMOTE_DIR="/opt/farmer-tracker"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Colores -------------------------------------------------
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
log()  { printf "${G}▶ %s${N}\n" "$*"; }
warn() { printf "${Y}⚠ %s${N}\n" "$*"; }
err()  { printf "${R}✗ %s${N}\n" "$*" >&2; exit 1; }
step() { printf "\n${B}━━━ %s ${N}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" "$*"; }

# ---- Pre-checks ----------------------------------------------
step "Comprobaciones previas"
command -v rsync &>/dev/null || err "rsync no está instalado en este equipo"
command -v ssh   &>/dev/null || err "ssh no está instalado"

log "Verificando conexión SSH con ${REMOTE_USER}@${REMOTE_HOST}…"
ssh -q -o ConnectTimeout=8 -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" exit 2>/dev/null \
  || err "No se puede conectar por SSH.\nAsegúrate de:\n  1. Que el servidor es accesible\n  2. Que tu clave pública está en ~/.ssh/authorized_keys del servidor\n     (ssh-copy-id ${REMOTE_USER}@${REMOTE_HOST})"

# ---- Sincronizar archivos ------------------------------------
step "Sincronizando código"
log "Destino: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

# Crear directorio remoto si no existe
ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo mkdir -p '${REMOTE_DIR}' && sudo chown '${REMOTE_USER}:${REMOTE_USER}' '${REMOTE_DIR}'"

rsync -az --progress \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '__pycache__/' \
  --exclude '*.pyc' \
  --exclude '.env' \
  --exclude 'uploads/' \
  --exclude 'frontend/dist/' \
  --exclude 'postgres_data/' \
  --exclude 'redis_data/' \
  --delete-excluded \
  "${LOCAL_DIR}/" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# ---- Primera vez vs actualización ----------------------------
FIRST_RUN=false
ssh "${REMOTE_USER}@${REMOTE_HOST}" "[ -f '${REMOTE_DIR}/.env' ]" 2>/dev/null || FIRST_RUN=true

if $FIRST_RUN; then
  step "Primera instalación"
  warn "No se encontró .env — se ejecutará el bootstrap completo"
  ssh -t "${REMOTE_USER}@${REMOTE_HOST}" "bash '${REMOTE_DIR}/scripts/server-bootstrap.sh'"
else
  step "Actualización"
  ssh -t "${REMOTE_USER}@${REMOTE_HOST}" "bash '${REMOTE_DIR}/scripts/server-update.sh'"
fi

printf "\n${G}✔ Deploy completado${N}\n"
printf "  → http://huertos.uideedev.com\n\n"
