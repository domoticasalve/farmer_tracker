server {
    listen 80;
    server_name huertos.uideedev.com;

    client_max_body_size 15M;

    # Frontend — archivos estáticos del build de React
    root /opt/farmer-tracker/frontend/dist;
    index index.html;

    # SPA fallback — todas las rutas van a index.html excepto /api y /uploads
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — proxy al contenedor FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # Uploads — fotos servidas directamente por Nginx
    location /uploads/ {
        alias /opt/farmer-tracker/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/huertos.access.log;
    error_log  /var/log/nginx/huertos.error.log;
}
