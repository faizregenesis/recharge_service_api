-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "link_class" TEXT NOT NULL,
    "icon_class" TEXT NOT NULL,
    "icon_name" TEXT NOT NULL,
    "menu_name" TEXT NOT NULL,
    "information" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mode_id" UUID,
    "pod_id" UUID,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_experience" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stroboscopic_light" SMALLINT NOT NULL,
    "audio_surround_sound" SMALLINT NOT NULL,
    "vibro_acoustics" SMALLINT NOT NULL,
    "led_intensity" SMALLINT NOT NULL,
    "led_color" SMALLINT NOT NULL,
    "infra_red_nea_ir" SMALLINT NOT NULL,
    "infra_red_far_ir" SMALLINT NOT NULL,
    "pemf_therapy" BOOLEAN NOT NULL,
    "olfactory_engagement" BOOLEAN NOT NULL,
    "binaural_beats_isochronic_tones" BOOLEAN NOT NULL,
    "direct_neutral_stimulation" BOOLEAN NOT NULL,
    "duration" DECIMAL(5,2) NOT NULL,
    "experience_id" UUID NOT NULL,
    "song" TEXT,
    "video" TEXT,
    "sound_scape" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "detail_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "circle_line_color" TEXT NOT NULL,
    "circle_line_width" DOUBLE PRECISION NOT NULL,
    "circle_fill_color" TEXT NOT NULL,
    "circle_icon" TEXT NOT NULL,
    "circle_caption" TEXT NOT NULL,
    "circle_size" DOUBLE PRECISION NOT NULL,
    "enable_disable_session" BOOLEAN NOT NULL,
    "order" SMALLINT NOT NULL,
    "tooltip" TEXT NOT NULL,
    "icon" TEXT,
    "experience_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "experiences_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_idx" ON "experiences"("id");

-- CreateIndex
CREATE INDEX "detail_experience_idx" ON "detail_experience"("id");

-- AddForeignKey
ALTER TABLE "detail_experience" ADD CONSTRAINT "detail_experience_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences_properties" ADD CONSTRAINT "experiences_properties_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
