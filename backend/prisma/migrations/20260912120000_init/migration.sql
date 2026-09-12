-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "original_url" VARCHAR(2048) NOT NULL,
    "short_code" VARCHAR(6) NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "reactivated_at" TIMESTAMPTZ,
    "last_health_checked_at" TIMESTAMPTZ,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_access_events" (
    "id" UUID NOT NULL,
    "link_id" UUID NOT NULL,
    "accessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_access_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "links_short_code_key" ON "links"("short_code");

-- CreateIndex
CREATE INDEX "links_user_id_idx" ON "links"("user_id");

-- CreateIndex
CREATE INDEX "links_status_idx" ON "links"("status");

-- CreateIndex
CREATE INDEX "link_access_events_link_id_accessed_at_idx" ON "link_access_events"("link_id", "accessed_at");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_access_events" ADD CONSTRAINT "link_access_events_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
