#!/bin/bash
# Vigilante de Colaboro (cron horario en el VPS).
# 1) Comprueba que la web responde. 2) Busca errores de servidor (digest) en
# los logs del contenedor de la última hora. Si hay algo, avisa al dueño por
# push (vía /api/cron/alert); si la app está caída y no puede avisar, manda
# email con el mismo SMTP que usa backup.sh.
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
if [ "$HEALTH" != "200" ]; then
  MSG="La web no responde (HTTP $HEALTH). Revisa el contenedor en el VPS."
elif [ "$TOTAL" -gt 0 ]; then
  TOP=$(echo "$RAW" | sort | uniq -c | sort -rn | head -1 | sed "s/ *\([0-9]*\) *digest: '\([0-9]*\)'/\2 (x\1)/")
  MSG="$TOTAL errores de servidor en la última hora. Digest más repetido: $TOP. Buscar con: docker logs $CONT | grep <digest>"
else
  exit 0
fi

echo "[$(date '+%F %T')] $MSG" >> "$LOG"

# ── Aviso: push por la app; si no se puede, email (SMTP de backup.sh) ─
PUSH=$(curl -s -m 15 -X POST -H "x-cron-secret: $CRON_SECRET" -H 'content-type: application/json' \
  -d "$(printf '{"body": "%s"}' "$MSG" | tr -d '\n')" "$BASE/api/cron/alert" || true)

if ! echo "$PUSH" | grep -q '"ok":true'; then
  set -a; source <(grep -E '^MAIL_' /root/workdesk/.env.local 2>/dev/null) || true; set +a
  if [ -n "${MAIL_HOST:-}" ]; then
    {
      echo "From: $MAIL_FROM"
      echo "To: $ALERT_TO"
      echo "Subject: [Colaboro] Aviso del vigilante"
      echo ""
      echo "$MSG"
    } | curl --silent --insecure --ssl-reqd --url "smtp://$MAIL_HOST:$MAIL_PORT" \
      --user "$MAIL_USER:$MAIL_PASS" --mail-from "$MAIL_FROM" --mail-rcpt "$ALERT_TO" \
      --upload-file - >> "$LOG" 2>&1 || echo "[$(date '+%F %T')] fallo también el email" >> "$LOG"
  fi
fi
