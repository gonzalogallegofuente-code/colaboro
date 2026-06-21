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

Desde el checkout local (`C:\workdesk\Colaboro`):

```bash
git add -A && git commit -m "..."
SHA=$(git rev-parse HEAD)
git archive --format=tar HEAD | ssh root@76.13.43.39 'rm -rf /root/colaboro/src /root/colaboro/public && tar xf - -C /root/colaboro'
ssh root@76.13.43.39 "cd /root/colaboro && GIT_SHA=$SHA docker compose build && GIT_SHA=$SHA docker compose up -d --force-recreate"
```

> El `.env.local` y el `docker-compose.yml` del VPS NO viajan en el archive
> (no están en git), así que se conservan entre despliegues.

### Verificar la versión viva

```bash
ssh root@76.13.43.39 'docker exec colaboro-colaboro-1 printenv GIT_SHA'   # = git rev-parse HEAD
curl -so /dev/null -w '%{http_code}\n' https://colaboro.srv1532791.hstgr.cloud/login   # 200
```

## Migraciones de BD

El esquema es propiedad del rol `workdesk` (dueño de la BD), así que se aplican
como `workdesk` por `127.0.0.1` (la regla `host all all 127.0.0.1/32 md5` lo permite):

```bash
# 1) edita src/lib/db/schema.ts  2) genera el SQL
npm run db:generate
# 3) aplícalo a prod y dev (PW = contraseña del rol workdesk)
cat drizzle/000X_*.sql | ssh root@76.13.43.39 "PGPASSWORD=$PW psql -h 127.0.0.1 -U workdesk -d colaboro -v ON_ERROR_STOP=1"
cat drizzle/000X_*.sql | ssh root@76.13.43.39 "PGPASSWORD=$PW psql -h 127.0.0.1 -U workdesk -d colaboro_dev -v ON_ERROR_STOP=1"
```

El despliegue NO ejecuta migraciones automáticamente (igual que workdesk).

## Desarrollo local

```bash
ssh -N -L 5433:localhost:5432 root@76.13.43.39   # túnel a Postgres (deja abierto)
# .env.local -> DATABASE_URL=...@localhost:5433/colaboro_dev
npm run dev
```
