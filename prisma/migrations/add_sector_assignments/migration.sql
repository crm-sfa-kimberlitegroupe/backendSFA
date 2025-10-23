-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "assigned_sector_id" UUID;

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN IF NOT EXISTS "sector_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_assigned_sector_id_idx" ON "user"("assigned_sector_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "outlet_sector_id_idx" ON "outlet"("sector_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_assigned_sector_id_fkey" FOREIGN KEY ("assigned_sector_id") REFERENCES "territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
