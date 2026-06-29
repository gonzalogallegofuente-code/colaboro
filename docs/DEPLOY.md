# Despliegue de Colaboro

App **independiente** del CRM workdesk. Comparte la infraestructura del VPS
(Postgres, Traefik, backups) pero tiene su propio contenedor, repo y BD.

- **URL**: https://colaboro.srv1532791.hstgr.cloud
- **VPS**: `root@76.13.43.39` (passwordless). Código en `/root/colaboro`.
- **Contenedor**: `colaboro-colaboro-1` (Docker Compose, red externa `openclaw-y2rv_default`).
- **Traefik**: enruta `Host(colaboro.srv1532791.hstgr.cloud)` → puerto 3000, TLS Let's Encrypt.
- **BD**: `colaboro` en el Postgres del host (rol `workdesk`, host `172.18.0.1`). Dev: `colaboro_dev`.
- **Postgres**: se añadieron reglas `pg_hba` para `colaboro`/`colaboro_dev` desde `172.18.0.0/16` y `127.0.0.1/32`.
- **Backups**: `/root/workdesk/backup.sh` vuelca también `colaboro` (cron 03:00, mismo bundle cifrado).

## Acceso

PIN compartido en `COLABORO_SECRET`/`COLABORO_PIN` de `/root/colaboro/.env.local`.
La cookie de sesión se firma con `COLABORO_SECRET` (HMAC), dura 1 año.

### Cambiar el PIN

```bash
ssh root@76.13.43.39
nano /root/colaboro/.env.local      # cambia COLABORO_PIN=...
cd /root/colaboro && docker compose up -d --force-recreate
```

## Desplegar cambios

Flujo **local → GitHub → servidor** (el VPS es un clon de GitHub y hace `git pull`).
`/root/colaboro` está enlazado a `origin/main`; `.env.local` y `docker-compose.yml`
son del VPS (no están en git, ignorados en `.git/info/exclude`) y se conservan.

Desde el checkout local (`C:\proyectos\colaboro`):

```bash
git add -A && git commit -m "..."
git push origin main
ssh root@76.13.43.39 "cd /root/colaboro && git pull --ff-only origin main && \
  GIT_SHA=\$(git rev-parse HEAD) docker compose build && \
  GIT_SHA=\$(git rev-parse HEAD) docker compose up -d --force-recreate"
```

Verificar la versión viva (debe coincidir con HEAD de `origin/main`):

```bash
ssh root@76.13.43.39 'docker exec colaboro-colaboro-1 printenv GIT_SHA'
```
