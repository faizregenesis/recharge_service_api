-- CreateTable
CREATE TABLE "generator_frequency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "frequency" INTEGER,
    "start_time" TEXT,
    "duration" TEXT,
    "fk_detail_experience" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "generator_frequency_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "generator_frequency" ADD CONSTRAINT "generator_frequency_fk_detail_experience_fkey" FOREIGN KEY ("fk_detail_experience") REFERENCES "detail_experience2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
