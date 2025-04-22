/*
  Warnings:

  - You are about to drop the `mode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `olfactory` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `update_date` on table `experiences2` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "firmware_version_status" AS ENUM ('active', 'nonactive');

-- CreateEnum
CREATE TYPE "app_version_status" AS ENUM ('active', 'nonactive');

-- DropForeignKey
ALTER TABLE "experiences2" DROP CONSTRAINT "experiences2_mode_id_fkey";

-- AlterTable
ALTER TABLE "experiences2" ALTER COLUMN "update_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "pod" ADD COLUMN     "fk_app_version" UUID,
ADD COLUMN     "fk_customer" UUID,
ADD COLUMN     "fk_firmware_version" UUID,
ADD COLUMN     "fk_group_id" UUID,
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "identification" DROP NOT NULL,
ALTER COLUMN "ip_address" DROP NOT NULL,
ALTER COLUMN "mac_address_bluetooth" DROP NOT NULL,
ALTER COLUMN "mac_address_pod" DROP NOT NULL;

-- DropTable
DROP TABLE "mode";

-- DropTable
DROP TABLE "olfactory";

-- CreateTable
CREATE TABLE "firmware_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firmware_id" TEXT,
    "light_version" TEXT,
    "chair_version" TEXT,
    "olvactory_version" TEXT,
    "manual_controll_version" TEXT,
    "air_condition_version" TEXT,
    "volume_controll_version" TEXT,
    "door_version" TEXT,
    "firmware_version_status" "firmware_version_status" NOT NULL DEFAULT 'active',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "firmware_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_name" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address" TEXT,
    "description" TEXT,
    "phone" VARCHAR(15),
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_version" (
    "description" TEXT NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notes" TEXT,
    "version" TEXT NOT NULL,
    "pub_date" TIMESTAMP(3),
    "app_version_status" "app_version_status" NOT NULL DEFAULT 'active',
    "fk_version_big_screen" UUID NOT NULL,
    "fk_version_small_screen" UUID NOT NULL,
    "fk_version_mobile_api" UUID NOT NULL,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "app_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_small_screen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file" TEXT NOT NULL,
    "date_realese" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT,
    "small_screen_version" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "version_small_screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_big_screen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file" TEXT NOT NULL,
    "date_realese" TIMESTAMP(3),
    "signature" TEXT,
    "big_screen_version" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "version_big_screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_mobile_api" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file" TEXT NOT NULL,
    "date_realese" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT,
    "mobile_api_version" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "version_mobile_api_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_group_name_key" ON "group"("group_name");

-- CreateIndex
CREATE UNIQUE INDEX "app_version_version_key" ON "app_version"("version");

-- CreateIndex
CREATE INDEX "pod_idx" ON "pod"("id");

-- AddForeignKey
ALTER TABLE "pod" ADD CONSTRAINT "pod_fk_customer_fkey" FOREIGN KEY ("fk_customer") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pod" ADD CONSTRAINT "pod_fk_app_version_fkey" FOREIGN KEY ("fk_app_version") REFERENCES "app_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pod" ADD CONSTRAINT "pod_fk_firmware_version_fkey" FOREIGN KEY ("fk_firmware_version") REFERENCES "firmware_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pod" ADD CONSTRAINT "pod_fk_group_id_fkey" FOREIGN KEY ("fk_group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_version" ADD CONSTRAINT "app_version_fk_version_big_screen_fkey" FOREIGN KEY ("fk_version_big_screen") REFERENCES "version_big_screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_version" ADD CONSTRAINT "app_version_fk_version_small_screen_fkey" FOREIGN KEY ("fk_version_small_screen") REFERENCES "version_small_screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_version" ADD CONSTRAINT "app_version_fk_version_mobile_api_fkey" FOREIGN KEY ("fk_version_mobile_api") REFERENCES "version_mobile_api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
