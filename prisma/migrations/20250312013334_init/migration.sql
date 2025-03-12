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
    "experience_id" UUID,
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
    "experience_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "experiences_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_names" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_test_user" BOOLEAN DEFAULT false,
    "reset_token" VARCHAR(255),
    "reset_token_expiration" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "otp_verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "rate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" UUID,
    "value" INTEGER,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "fk_user_id" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_and_conditions_accepted" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_user_id" UUID NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "terms_and_conditions_accepted_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_and_conditions_answers" (
    "id" SMALLSERIAL NOT NULL,
    "fk_user_id" UUID NOT NULL,
    "fk_question_id" SMALLINT NOT NULL,
    "answer" BOOLEAN NOT NULL DEFAULT false,
    "answer_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "terms_and_conditions_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_and_conditions_questions" (
    "id" SMALLSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "information" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "terms_and_conditions_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_development" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_pod_id" UUID,
    "self_development_name" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "created_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "self_development_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_development_sound" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "self_development_id" UUID,
    "sound_code" INTEGER,
    "duration" TEXT,
    "description" TEXT,
    "sound_path" TEXT,
    "file_path" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "created_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "self_development_sound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socket_topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_name" TEXT,
    "event_description" TEXT,
    "topic" TEXT,
    "action" TEXT,
    "retain" BOOLEAN,
    "publish_example_value" JSONB,
    "subscribe_example_value" JSONB,
    "value_range" TEXT,
    "remarks" TEXT,
    "keyword" TEXT,
    "auth_status" BOOLEAN,
    "deleted_at" TIMESTAMP(6),
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socket_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pod_topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_name" TEXT,
    "event_description" TEXT,
    "topic" TEXT,
    "action" TEXT,
    "retain" BOOLEAN,
    "publish_example_value" JSONB,
    "subscribe_example_value" JSONB,
    "value_range" TEXT,
    "remarks" TEXT,
    "keyword" TEXT,
    "deleted_at" TIMESTAMP(6),
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pod_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pod_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_pod_topic_id" UUID NOT NULL,
    "action" TEXT,
    "value" JSONB,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pod_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_idx" ON "experiences"("id");

-- CreateIndex
CREATE INDEX "detail_experience_idx" ON "detail_experience"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_idx" ON "user"("user_id", "username");

-- CreateIndex
CREATE INDEX "fk_user_idx" ON "rate"("fk_user_id");

-- CreateIndex
CREATE INDEX "rate_experience_idx" ON "rate"("experience_id");

-- CreateIndex
CREATE INDEX "terms_and_conditions_accepted_idx" ON "terms_and_conditions_accepted"("id", "fk_user_id");

-- CreateIndex
CREATE INDEX "terms_and_conditions_questions_idx" ON "terms_and_conditions_questions"("id", "active");

-- CreateIndex
CREATE INDEX "socket_topic_idx" ON "socket_topics"("id");

-- CreateIndex
CREATE INDEX "pod_topics_idx" ON "pod_topics"("id");

-- CreateIndex
CREATE INDEX "pod_history_idx" ON "pod_history"("id", "fk_pod_topic_id");

-- AddForeignKey
ALTER TABLE "rate" ADD CONSTRAINT "rate_fk_user_id_fkey" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_accepted" ADD CONSTRAINT "user_id_foreign_key" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_answers" ADD CONSTRAINT "fk_question" FOREIGN KEY ("fk_question_id") REFERENCES "terms_and_conditions_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_answers" ADD CONSTRAINT "fk_user" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pod_history" ADD CONSTRAINT "fk_pod_topic_id" FOREIGN KEY ("fk_pod_topic_id") REFERENCES "pod_topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
