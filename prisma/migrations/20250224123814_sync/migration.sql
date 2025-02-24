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

-- AddForeignKey
ALTER TABLE "rate" ADD CONSTRAINT "rate_fk_user_id_fkey" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_accepted" ADD CONSTRAINT "user_id_foreign_key" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_answers" ADD CONSTRAINT "fk_question" FOREIGN KEY ("fk_question_id") REFERENCES "terms_and_conditions_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_and_conditions_answers" ADD CONSTRAINT "fk_user" FOREIGN KEY ("fk_user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
