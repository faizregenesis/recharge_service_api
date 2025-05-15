-- AlterTable
ALTER TABLE "detail_experience2" ADD COLUMN     "order" INTEGER,
ADD COLUMN     "order_experience" INTEGER,
ADD COLUMN     "pemf_value" INTEGER,
ADD COLUMN     "uva" INTEGER,
ADD COLUMN     "uvb" INTEGER,
ADD COLUMN     "uvc" INTEGER;

-- AlterTable
ALTER TABLE "experiences2" ADD COLUMN     "order_experience" INTEGER;
