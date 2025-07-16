-- CreateTable
CREATE TABLE "trainingMode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pod_id" UUID,
    "link_class" TEXT,
    "icon_class" TEXT,
    "icon_name" TEXT,
    "menu_name" TEXT,
    "information" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order_Training_mode" INTEGER,
    "total_usage_time" INTEGER,
    "created_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "trainingMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_training_mode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stroboscopic_light" SMALLINT NOT NULL,
    "audio_surround_sound" SMALLINT NOT NULL,
    "vibro_acoustics" SMALLINT NOT NULL,
    "led_intensity" SMALLINT NOT NULL,
    "led_color" SMALLINT NOT NULL,
    "infra_red_nea_ir" SMALLINT NOT NULL,
    "infra_red_far_ir" SMALLINT NOT NULL,
    "pemf_therapy" BOOLEAN NOT NULL DEFAULT true,
    "olfactory_engagement" BOOLEAN NOT NULL DEFAULT true,
    "binaural_beats_isochronic_tones" BOOLEAN NOT NULL,
    "direct_neutral_stimulation" BOOLEAN NOT NULL,
    "duration" DECIMAL(5,2) NOT NULL,
    "training_id" UUID,
    "song" TEXT,
    "video" TEXT,
    "lamp" TEXT,
    "sound_scape" INTEGER NOT NULL,
    "order" INTEGER,
    "order_experience" INTEGER,
    "uva" INTEGER,
    "uvb" INTEGER,
    "uvc" INTEGER,
    "pemf_value" INTEGER,
    "scent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "detail_training_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "burst_time_bio_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "start_time" TEXT,
    "duration" TEXT,
    "fk_detail_training_mode" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "burst_time_bio_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generator_frequency_bio_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "frequency" INTEGER,
    "start_time" TEXT,
    "duration" TEXT,
    "fk_detail_training_mode" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "generator_frequency_bio_feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trainingMode" ADD CONSTRAINT "trainingMode_pod_id_fkey" FOREIGN KEY ("pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_training_mode" ADD CONSTRAINT "detail_training_mode_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainingMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burst_time_bio_feedback" ADD CONSTRAINT "burst_time_bio_feedback_fk_detail_training_mode_fkey" FOREIGN KEY ("fk_detail_training_mode") REFERENCES "detail_training_mode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generator_frequency_bio_feedback" ADD CONSTRAINT "generator_frequency_bio_feedback_fk_detail_training_mode_fkey" FOREIGN KEY ("fk_detail_training_mode") REFERENCES "detail_training_mode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
