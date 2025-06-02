-- AlterTable
ALTER TABLE "detail_experience" ADD COLUMN     "order" INTEGER,
ADD COLUMN     "order_experience" INTEGER;

-- AlterTable
ALTER TABLE "experiences" ADD COLUMN     "order_experience" INTEGER;

-- AlterTable
ALTER TABLE "self_development" ADD COLUMN     "order" INTEGER;

-- AlterTable
ALTER TABLE "self_development_sound" ADD COLUMN     "order" INTEGER,
ADD COLUMN     "self_dev_order" INTEGER;

-- AlterTable
ALTER TABLE "self_development_sound2" ADD COLUMN     "self_dev_order" INTEGER;
