-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL,
    "task_type_id" UUID,
    "pod_id" UUID,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "task_code" TEXT,
    "task_json" JSONB,
    "template_style" JSONB,
    "informations" JSONB,
    "sound_task_id" JSONB,
    "rgb_led" JSONB,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "igniter" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "fk_task" UUID,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "igniter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "last_state" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "fk_task" UUID,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "last_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "name" TEXT,
    "small_screen" TEXT,
    "big_screen" TEXT,
    "number_of_input" INTEGER,
    "number_of_output" INTEGER,
    "back" BOOLEAN,
    "home" BOOLEAN,
    "settings" BOOLEAN,
    "template_style" JSONB,
    "template_tooltips" JSONB,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "task_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tooltips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT,
    "detail_id" TEXT,
    "description" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "tooltips_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_pod_id_fkey" FOREIGN KEY ("pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_task_type_id_fkey" FOREIGN KEY ("task_type_id") REFERENCES "task_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "igniter" ADD CONSTRAINT "igniter_fk_task_fkey" FOREIGN KEY ("fk_task") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "last_state" ADD CONSTRAINT "last_state_fk_task_fkey" FOREIGN KEY ("fk_task") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
