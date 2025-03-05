/*
  Warnings:

  - The `sound_code` column on the `self_development_sound` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "self_development" ADD COLUMN     "fk_pod_id" UUID,
ALTER COLUMN "created_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "self_development_sound" DROP COLUMN "sound_code",
ADD COLUMN     "sound_code" INTEGER,
ALTER COLUMN "created_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "self_development_sound" ADD CONSTRAINT "self_development_sound_self_development_id_fkey" FOREIGN KEY ("self_development_id") REFERENCES "self_development"("id") ON DELETE SET NULL ON UPDATE CASCADE;
