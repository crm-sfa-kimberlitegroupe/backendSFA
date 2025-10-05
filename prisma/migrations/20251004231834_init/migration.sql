-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis" WITH VERSION "3.4";

-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('ADMIN', 'SUP', 'REP');

-- CreateEnum
CREATE TYPE "UserStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OutletStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RouteStatusEnum" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "RouteStopStatusEnum" AS ENUM ('PLANNED', 'VISITED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskStatusEnum" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethodEnum" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT');

-- CreateEnum
CREATE TYPE "SyncOpEnum" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "territory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "parent_id" UUID,
    "geom" geometry(MULTIPOLYGON, 4326),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "RoleEnum" NOT NULL,
    "status" "UserStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "territory_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "segment" TEXT,
    "address" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "geom" geography(POINT, 4326),
    "open_hours" JSONB,
    "territory_id" UUID NOT NULL,
    "status" "OutletStatusEnum" NOT NULL DEFAULT 'PENDING',
    "proposed_by" UUID,
    "validated_by" UUID,
    "validated_at" TIMESTAMPTZ,
    "validation_comment" TEXT,
    "osm_place_id" TEXT,
    "osm_metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "RouteStatusEnum" NOT NULL DEFAULT 'PLANNED',
    "is_off_route" BOOLEAN NOT NULL DEFAULT false,
    "constraints" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "route_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_plan_id" UUID NOT NULL,
    "outlet_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "eta" TIMESTAMPTZ,
    "duration_planned" INTEGER,
    "status" "RouteStopStatusEnum" NOT NULL DEFAULT 'PLANNED',
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outlet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checkin_at" TIMESTAMPTZ NOT NULL,
    "checkin_lat" DECIMAL(9,6),
    "checkin_lng" DECIMAL(9,6),
    "checkout_at" TIMESTAMPTZ,
    "checkout_lat" DECIMAL(9,6),
    "checkout_lng" DECIMAL(9,6),
    "duration_min" INTEGER,
    "notes" TEXT,
    "score" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_check" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "visit_id" UUID NOT NULL,
    "checklist" JSONB,
    "planogram" JSONB,
    "score" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "merch_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_photo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "merch_check_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,
    "taken_at" TIMESTAMPTZ NOT NULL,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "merch_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "outlet_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatusEnum" NOT NULL DEFAULT 'PENDING',
    "form_data" JSONB,
    "due_date" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ean" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT,
    "price_ht" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(4,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outlet_id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "alert_threshold" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outlet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "visit_id" UUID,
    "status" "OrderStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(4,2) NOT NULL,
    "line_total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "line_total_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "method" "PaymentMethodEnum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_ref" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "diff" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "op" "SyncOpEnum" NOT NULL,
    "payload" JSONB,
    "version" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "territory_code_key" ON "territory"("code");

-- CreateIndex
CREATE INDEX "territory_parent_id_idx" ON "territory"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_territory_id_idx" ON "user"("territory_id");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "outlet_code_key" ON "outlet"("code");

-- CreateIndex
CREATE INDEX "outlet_territory_id_idx" ON "outlet"("territory_id");

-- CreateIndex
CREATE INDEX "outlet_channel_idx" ON "outlet"("channel");

-- CreateIndex
CREATE INDEX "outlet_segment_idx" ON "outlet"("segment");

-- CreateIndex
CREATE INDEX "outlet_status_idx" ON "outlet"("status");

-- CreateIndex
CREATE INDEX "route_plan_user_id_idx" ON "route_plan"("user_id");

-- CreateIndex
CREATE INDEX "route_plan_date_idx" ON "route_plan"("date");

-- CreateIndex
CREATE INDEX "route_stop_route_plan_id_idx" ON "route_stop"("route_plan_id");

-- CreateIndex
CREATE INDEX "route_stop_outlet_id_idx" ON "route_stop"("outlet_id");

-- CreateIndex
CREATE INDEX "route_stop_seq_idx" ON "route_stop"("seq");

-- CreateIndex
CREATE INDEX "visit_outlet_id_idx" ON "visit"("outlet_id");

-- CreateIndex
CREATE INDEX "visit_user_id_idx" ON "visit"("user_id");

-- CreateIndex
CREATE INDEX "visit_checkin_at_idx" ON "visit"("checkin_at");

-- CreateIndex
CREATE INDEX "merch_check_visit_id_idx" ON "merch_check"("visit_id");

-- CreateIndex
CREATE INDEX "merch_photo_merch_check_id_idx" ON "merch_photo"("merch_check_id");

-- CreateIndex
CREATE INDEX "task_assigned_to_idx" ON "task"("assigned_to");

-- CreateIndex
CREATE INDEX "task_assigned_by_idx" ON "task"("assigned_by");

-- CreateIndex
CREATE INDEX "task_outlet_id_idx" ON "task"("outlet_id");

-- CreateIndex
CREATE INDEX "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sku_ean_key" ON "sku"("ean");

-- CreateIndex
CREATE INDEX "sku_brand_idx" ON "sku"("brand");

-- CreateIndex
CREATE INDEX "sku_category_idx" ON "sku"("category");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_outlet_id_sku_id_key" ON "inventory"("outlet_id", "sku_id");

-- CreateIndex
CREATE INDEX "order_outlet_id_idx" ON "order"("outlet_id");

-- CreateIndex
CREATE INDEX "order_user_id_idx" ON "order"("user_id");

-- CreateIndex
CREATE INDEX "order_created_at_idx" ON "order"("created_at");

-- CreateIndex
CREATE INDEX "order_line_order_id_idx" ON "order_line"("order_id");

-- CreateIndex
CREATE INDEX "order_line_sku_id_idx" ON "order_line"("sku_id");

-- CreateIndex
CREATE INDEX "payment_order_id_idx" ON "payment"("order_id");

-- CreateIndex
CREATE INDEX "payment_paid_at_idx" ON "payment"("paid_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_at_idx" ON "audit_log"("at");

-- CreateIndex
CREATE INDEX "sync_queue_entity_entity_id_idx" ON "sync_queue"("entity", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_queue_version_key" ON "sync_queue"("version");

-- AddForeignKey
ALTER TABLE "territory" ADD CONSTRAINT "territory_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_plan" ADD CONSTRAINT "route_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_route_plan_id_fkey" FOREIGN KEY ("route_plan_id") REFERENCES "route_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_check" ADD CONSTRAINT "merch_check_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_photo" ADD CONSTRAINT "merch_photo_merch_check_id_fkey" FOREIGN KEY ("merch_check_id") REFERENCES "merch_check"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
