ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "reset_token_hash" text;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "reset_expires" timestamp with time zone;
