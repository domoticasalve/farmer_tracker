# ============================================================
#  Farmer Tracker — Comandos de gestión
#  Uso: make deploy REMOTE_HOST=tu-servidor.com
#       make logs   REMOTE_HOST=tu-servidor.com
# ============================================================

REMOTE_USER ?= ubuntu
REMOTE_HOST ?=
REMOTE_DIR  := /opt/farmer-tracker
SSH         := ssh $(REMOTE_USER)@$(REMOTE_HOST)

.PHONY: deploy logs ps stop start restart shell db-shell \
        backup-db restore-db nginx-reload clean-uploads help

# ─── Deploy ──────────────────────────────────────────────────
deploy:
	@[ -n "$(REMOTE_HOST)" ] || (echo "❌ Indica el servidor: make deploy REMOTE_HOST=tu-ip" && exit 1)
	REMOTE_HOST=$(REMOTE_HOST) REMOTE_USER=$(REMOTE_USER) bash deploy.sh

# ─── Monitorización ──────────────────────────────────────────
logs:
	$(SSH) "cd $(REMOTE_DIR) && docker compose logs -f --tail=80"

logs-api:
	$(SSH) "cd $(REMOTE_DIR) && docker compose logs -f --tail=80 api"

ps:
	$(SSH) "cd $(REMOTE_DIR) && docker compose ps"

health:
	$(SSH) "curl -s http://localhost:8088/api/health | python3 -m json.tool"

# ─── Control de servicios ────────────────────────────────────
stop:
	$(SSH) "cd $(REMOTE_DIR) && docker compose stop"

start:
	$(SSH) "cd $(REMOTE_DIR) && docker compose start"

restart:
	$(SSH) "cd $(REMOTE_DIR) && docker compose restart api"

restart-all:
	$(SSH) "cd $(REMOTE_DIR) && docker compose down && docker compose up -d"

# ─── Acceso a contenedores ───────────────────────────────────
shell:
	$(SSH) -t "docker exec -it farmer-api bash"

db-shell:
	$(SSH) -t "docker exec -it farmer-postgres psql -U farmer farmer_tracker"

redis-shell:
	$(SSH) -t "docker exec -it farmer-redis redis-cli"

# ─── Base de datos ───────────────────────────────────────────
backup-db:
	@[ -n "$(REMOTE_HOST)" ] || (echo "❌ Indica REMOTE_HOST" && exit 1)
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	$(SSH) "docker exec farmer-postgres pg_dump -U farmer farmer_tracker" \
	  > "backup_farmer_tracker_$$TIMESTAMP.sql"; \
	echo "✔ Backup guardado: backup_farmer_tracker_$$TIMESTAMP.sql"

restore-db:
	@[ -n "$(FILE)" ] || (echo "❌ Indica el archivo: make restore-db FILE=backup.sql" && exit 1)
	cat "$(FILE)" | $(SSH) "docker exec -i farmer-postgres psql -U farmer farmer_tracker"
	@echo "✔ Base de datos restaurada desde $(FILE)"

# ─── Nginx ───────────────────────────────────────────────────
nginx-reload:
	$(SSH) "sudo nginx -t && sudo systemctl reload nginx"

nginx-logs:
	$(SSH) "sudo tail -f /var/log/nginx/huertos.access.log /var/log/nginx/huertos.error.log"

# ─── Limpieza ────────────────────────────────────────────────
clean-docker:
	$(SSH) "docker system prune -f --volumes"

clean-uploads:
	@echo "⚠ Esto borrará TODAS las fotos subidas. ¿Continuar? [y/N]" && read ans && [ "$$ans" = "y" ]
	$(SSH) "rm -rf $(REMOTE_DIR)/uploads/*"

# ─── Ayuda ───────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Farmer Tracker — Comandos disponibles"
	@echo "  Uso: make <comando> REMOTE_HOST=tu-servidor.com"
	@echo ""
	@echo "  Deploy:"
	@echo "    deploy          Sincroniza y despliega (primera vez: bootstrap completo)"
	@echo ""
	@echo "  Monitorización:"
	@echo "    logs            Ver logs de todos los servicios en tiempo real"
	@echo "    logs-api        Ver solo logs de la API"
	@echo "    ps              Estado de los contenedores"
	@echo "    health          Ping al endpoint de salud de la API"
	@echo ""
	@echo "  Control:"
	@echo "    stop            Parar todos los servicios"
	@echo "    start           Arrancar todos los servicios"
	@echo "    restart         Reiniciar solo la API"
	@echo "    restart-all     Reiniciar todo desde cero"
	@echo ""
	@echo "  Acceso:"
	@echo "    shell           Shell dentro del contenedor API"
	@echo "    db-shell        Consola PostgreSQL"
	@echo "    redis-shell     Consola Redis"
	@echo ""
	@echo "  Base de datos:"
	@echo "    backup-db       Exportar BD a archivo SQL local"
	@echo "    restore-db      Importar desde FILE=ruta.sql"
	@echo ""
	@echo "  Nginx:"
	@echo "    nginx-reload    Recargar configuración Nginx"
	@echo "    nginx-logs      Seguir logs de acceso y error"
	@echo ""
