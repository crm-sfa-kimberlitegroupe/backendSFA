-- Add profile fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "employee_id" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "hire_date" DATE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "manager_id" UUID;

-- Add foreign key constraint for manager
ALTER TABLE "user" ADD CONSTRAINT "user_manager_id_fkey" 
  FOREIGN KEY ("manager_id") REFERENCES "user"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on manager_id
CREATE INDEX IF NOT EXISTS "user_manager_id_idx" ON "user"("manager_id");
