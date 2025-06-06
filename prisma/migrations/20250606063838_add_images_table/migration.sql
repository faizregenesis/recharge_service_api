-- CreateTable
CREATE TABLE "imageData" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "imageurl" TEXT,
    "imageName" TEXT,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "imageData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imageData_imageName_key" ON "imageData"("imageName");
