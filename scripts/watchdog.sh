#!/bin/bash
# Vigilante de Colaboro (cron horario en el VPS).
# 1) Comprueba que la web responde. 2) Busca errores de servidor (digest) en
# los logs del contenedor de la última hora. Si hay algo:
#   - PUSH al dueño (aviso rápido, vía /api/cron/alert), y
#   - EMAIL con el detalle del error (extracto de los logs) — siempre, para
#     poder actuar sabiendo qué ha pasado exactamente.
set -u

BASE="https://colaboro.srv1532791.hstgr.cloud"
ENVFILE="/root/colaboro/.env.local"
CONT="colaboro-colaboro-1"
ALERT_TO="gonzalo.gallego.fuente@gmail.com"
LOG="/root/colaboro/watchdog.log"

CRON_SECRET=$(grep '^CRON_SECRET=' "$ENVFILE" | cut -d= -f2-)

# ── Estado ───────────────────────────────────────────────────────────
HEALTH=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$BASE/login" || echo 000)
RAW=$(docker logs --since 65m "$CONT" 2>&1 | grep -oE "digest: '[0-9]+'" || true)
TOTAL=$(echo -n "$RAW" | grep -c "digest" || true)

MSG=""
DETALLE=""
if [ "$HEALTH" != "200" ]; then
  MSG="La web no responde (HTTP $HEALTH). Revisa el contenedor en el VPS."
  DETALLE=$(docker logs --since 20m "$CONT" 2>&1 | tail -40)
elif [ "$TOTAL" -gt 0 ]; then
  TOPD=$(echo "$RAW" | sort | uniq -c | sort -rn | head -1 | grep -oE "[0-9]+'" | tr -d "'")
  MSG="$TOTAL errores de servidor en la última hora. Digest más repetido: $TOPD. Detalle en el email."
  DETALLE=$(docker logs --since 65m "$CONT" 2>&1 | grep -B 8 -A 28 -m1 "digest: '$TOPD'")
else
  exit 0
fi

echo "[$(date '+%F %T')] $MSG" >> "$LOG"

# ── PUSH (aviso rápido; puede fallar si la app está caída) ──────────
curl -s -m 15 -X POST -H "x-cron-secret: $CRON_SECRET" -H 'content-type: application/json' \
  -d "$(printf '{"body": "%s"}' "$MSG" | tr -d '\n')" "$BASE/api/cron/alert" >/dev/null 2>&1 || true

# ── EMAIL con el detalle (siempre que haya incidencia) ──────────────
set -a; source <(grep -E '^MAIL_' /root/workdesk/.env.local 2>/dev/null) || true; set +a
if [ -n "${MAIL_HOST:-}" ]; then
  {
    echo "From: $MAIL_FROM"
    echo "To: $ALERT_TO"
    echo "Subject: [Colaboro] Aviso del vigilante"
    echo ""
    echo "$MSG"
    echo ""
    echo "──── Detalle del error (extracto de los logs) ────"
    echo "$DETALLE"
    echo ""
    echo "Puedes pegar este email tal cual a Claude para el diagnóstico."
  } | curl --silent --insecure --ssl-reqd --url "smtp://$MAIL_HOST:$MAIL_PORT" \
    --user "$MAIL_USER:$MAIL_PASS" --mail-from "$MAIL_FROM" --mail-rcpt "$ALERT_TO" \
    --upload-file - >> "$LOG" 2>&1 || echo "[$(date '+%F %T')] fallo el envío del email" >> "$LOG"
fi
