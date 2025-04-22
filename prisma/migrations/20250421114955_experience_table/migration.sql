-- CreateTable
CREATE TABLE "self_development2" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "self_development_name" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "fk_pod_id" UUID,
    "created_date" TIMESTAMPTZ(6),
    "updated_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "self_development2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_development_sound2" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "self_development_id" UUID,
    "sound_code" INTEGER,
    "duration" TEXT,
    "description" TEXT,
    "sound_path" TEXT,
    "file_path" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "deleted_at" TIMESTAMP(6),
    "created_date" TIMESTAMPTZ(6),
    "updated_date" TIMESTAMPTZ(6),

    CONSTRAINT "self_development_sound2_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "self_development2" ADD CONSTRAINT "self_development2_fk_pod_id_fkey" FOREIGN KEY ("fk_pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_development_sound2" ADD CONSTRAINT "self_development_sound2_self_development_id_fkey" FOREIGN KEY ("self_development_id") REFERENCES "self_development2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
