-- CreateTable
CREATE TABLE "self_development" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "self_development_name" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "created_date" TIMESTAMPTZ(6),
    "updated_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "self_development_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_development_sound" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "self_development_id" UUID,
    "sound_code" TEXT,
    "duration" TEXT,
    "description" TEXT,
    "sound_path" TEXT,
    "file_path" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "deleted_at" TIMESTAMP(6),
    "created_date" TIMESTAMPTZ(6),
    "updated_date" TIMESTAMPTZ(6),

    CONSTRAINT "self_development_sound_pkey" PRIMARY KEY ("id")
);
