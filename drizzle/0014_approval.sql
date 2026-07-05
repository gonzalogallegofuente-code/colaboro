ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requires_approval" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "completions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'approved' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "completions_pending_idx" ON "completions"("kid_id") WHERE "status" = 'pending';
