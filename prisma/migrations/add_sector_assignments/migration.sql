-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "assigned_sector_id" UUID;

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN IF NOT EXISTS "sector_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_assigned_sector_id_idx" ON "user"("assigned_sector_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "outlet_sector_id_idx" ON "outlet"("sector_id");

-- AddForeignKey (with IF NOT EXISTS handling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_assigned_sector_id_fkey'
    ) THEN
        ALTER TABLE "user" ADD CONSTRAINT "user_assigned_sector_id_fkey" FOREIGN KEY ("assigned_sector_id") REFERENCES "territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (with IF NOT EXISTS handling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'outlet_sector_id_fkey'
    ) THEN
        ALTER TABLE "outlet" ADD CONSTRAINT "outlet_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
