-- CreateTable
CREATE TABLE "matrix_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_question_id" SMALLINT NOT NULL,
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
    "duration" DECIMAL(5,2),
    "song" TEXT,
    "video" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "matrix_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matrix_user_fk_question_id_key" ON "matrix_user"("fk_question_id");

-- AddForeignKey
ALTER TABLE "matrix_user" ADD CONSTRAINT "matrix_user_fk_question_id_fkey" FOREIGN KEY ("fk_question_id") REFERENCES "terms_and_conditions_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
