ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "family_goal_target" integer;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "family_goal_reward" text;
