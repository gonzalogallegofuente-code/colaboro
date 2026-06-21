# Colaboro

App para apuntar las tareas de casa de los hijos y llevar la cuenta de lo que ganan.

- Cada tarea vale lo que se le ponga (por defecto 1 €; la basura 0,50 €).
- Contador por hijo: lo de **esta semana**, lo **sin pagar** (acumulado) y un botón **Pagar** que lo liquida y guarda en el histórico.
- **Objetivo semanal** por tarea (las casillas de la hoja de papel) con progreso `n/objetivo`.
- Se puede **apuntar en un día anterior** (Hoy / Ayer / cualquier fecha).
- **Semanas de sábado a viernes.**
- **Histórico** por semana y lista de pagos.
- Acceso con **PIN** y PWA instalable en el móvil.

## Stack

Next.js 16 (App Router, salida `standalone`) · Drizzle ORM · Postgres · Tailwind v4.
Mismo patrón de despliegue que `workdesk` (Docker tras Traefik en el VPS).

## Desarrollo local

La BD vive en el VPS y se llega por túnel SSH (igual que workdesk):

```bash
# 1) Túnel (deja la terminal abierta)
ssh -N -L 5433:localhost:5432 root@76.13.43.39
# 2) .env.local
cp .env.example .env.local   # y rellena DATABASE_URL (…@localhost:5433/colaboro_dev), PIN y SECRET
# 3) Esquema + datos de ejemplo (solo la primera vez)
npm run db:push
# 4) Arrancar
npm run dev
```

## Variables de entorno

| Var | Para qué |
|-----|----------|
| `DATABASE_URL` | Postgres (la app crea sus tablas ahí) |
| `COLABORO_PIN` | PIN compartido de acceso |
| `COLABORO_SECRET` | Firma de la cookie de sesión (`openssl rand -base64 32`) |
| `TZ` | `Europe/Madrid` (afecta a «hoy» y al cálculo de la semana) |

## Iconos PWA

```bash
# desde la raíz de workdesk (donde está instalado sharp)
node Colaboro/scripts/make-icons.mjs Colaboro/public
```

## Despliegue

Ver `docs/DEPLOY.md`.
