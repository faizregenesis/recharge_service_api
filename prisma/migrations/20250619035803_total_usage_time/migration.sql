/*
  Warnings:

  - You are about to drop the column `total_usage_time` on the `detail_experience2` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "detail_experience2" DROP COLUMN "total_usage_time";

-- AlterTable
ALTER TABLE "self_development_sound2" ADD COLUMN     "total_usage_time" INTEGER;
