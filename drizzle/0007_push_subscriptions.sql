-- Suscripciones de notificaciones push (por cuenta / dispositivo).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          serial PRIMARY KEY,
  account_id  integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_account_idx ON push_subscriptions(account_id);
