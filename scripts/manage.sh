#!/usr/bin/env bash
# ============================================================
#  Farmer Tracker — Script de gestión en el servidor
#  Ejecutar DIRECTAMENTE en el servidor Ubuntu:
#    bash /opt/farmer-tracker/scripts/manage.sh <comando>
#
#  Comandos: status | logs | restart | backup | update-env
# ============================================================
set -euo pipefail

APP_DIR="/opt/farmer-tracker"
cd "$APP_DIR"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
ok()  { printf "${G}✔ %s${N}\n" "$*"; }
warn(){ printf "${Y}⚠ %s${N}\n" "$*"; }
err() { printf "${R}✗ %s${N}\n" "$*" >&2; exit 1; }

if groups "$USER" | grep -q docker; then
  DC="docker compose"
else
  DC="sudo docker compose"
fi

CMD="${1:-status}"

case "$CMD" in

  # ── Estado general ──────────────────────────────────────
  status)
    echo ""
    printf "${G}═══ Farmer Tracker — Estado ════════════════════════${N}\n\n"
    $DC ps
    echo ""
    printf "API health: "
    sudo docker exec farmer-api wget -qO- http://localhost:8000/api/health 2>/dev/null \
      && echo "" || warn "No responde"
    echo ""
    printf "Espacio en uploads:  $(du -sh $APP_DIR/uploads/ 2>/dev/null | cut -f1)\n"
    printf "Espacio en postgres: $(du -sh $APP_DIR/postgres_data/ 2>/dev/null | cut -f1 || echo 'n/a')\n"
    echo ""
    ;;

  # ── Logs ────────────────────────────────────────────────
  logs)
    SERVICE="${2:-}"
    if [ -n "$SERVICE" ]; then
      $DC logs -f --tail=100 "$SERVICE"
    else
      $DC logs -f --tail=50
    fi
    ;;

  # ── Reiniciar API ───────────────────────────────────────
  restart)
    warn "Reiniciando API…"
    $DC restart api
    ok "API reiniciada"
    ;;

  restart-all)
    warn "Reiniciando todos los servicios…"
    $DC down
    $DC up -d
    ok "Servicios reiniciados"
    ;;

  # ── Backup de base de datos ─────────────────────────────
  backup)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$APP_DIR/backup_${TIMESTAMP}.sql"
    warn "Creando backup en $BACKUP_FILE…"
    sudo docker exec farmer-postgres \
      pg_dump -U farmer farmer_tracker > "$BACKUP_FILE"
    ok "Backup guardado: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"
    ;;

  # ── Ver/editar .env ─────────────────────────────────────
  env)
    nano "$APP_DIR/.env"
    warn "Reinicia la API para aplicar cambios: bash $0 restart"
    ;;

  # ── Limpiar caché de clima ──────────────────────────────
  clear-weather-cache)
    warn "Limpiando caché de previsión meteorológica…"
    sudo docker exec farmer-postgres \
      psql -U farmer farmer_tracker -c "DELETE FROM weather_cache;"
    ok "Caché de clima eliminada"
    ;;

  # ── Actualizar solo el frontend ─────────────────────────
  rebuild-frontend)
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
    warn "Reconstruyendo frontend…"
    cd "$APP_DIR/frontend"
    npm ci --silent
    npm run build
    cd "$APP_DIR"
    sudo systemctl reload nginx
    ok "Frontend reconstruido y Nginx recargado"
    ;;

  # ── Información del sistema ─────────────────────────────
  info)
    echo ""
    printf "${G}═══ Información del sistema ════════════════════════${N}\n\n"
    printf "Docker:      $(docker --version | cut -d' ' -f3 | tr -d ',')\n"
    printf "Node.js:     $(node --version 2>/dev/null || echo 'no instalado')\n"
    printf "Nginx:       $(nginx -v 2>&1 | cut -d'/' -f2)\n"
    printf "App dir:     $APP_DIR\n"
    printf "Frontend:    $APP_DIR/frontend/dist\n"
    printf "Uploads:     $APP_DIR/uploads\n\n"
    ;;

  # ── Ayuda ────────────────────────────────────────────────
  help|*)
    echo ""
    echo "  Uso: bash /opt/farmer-tracker/scripts/manage.sh <comando>"
    echo ""
    echo "  status            Estado de todos los servicios"
    echo "  logs [servicio]   Logs en tiempo real (api | postgres | redis)"
    echo "  restart           Reiniciar la API"
    echo "  restart-all       Reiniciar todos los contenedores"
    echo "  backup            Crear backup de PostgreSQL"
    echo "  env               Editar .env con nano"
    echo "  clear-weather-cache  Limpiar caché de Open-Meteo"
    echo "  rebuild-frontend  Recompilar el frontend y recargar Nginx"
    echo "  info              Versiones y rutas del sistema"
    echo ""
    ;;
esac
