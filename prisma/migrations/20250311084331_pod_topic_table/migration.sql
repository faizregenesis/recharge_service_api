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
CREATE INDEX "socket_topic_idx" ON "socket_topics"("id");

-- CreateIndex
CREATE INDEX "pod_topics_idx" ON "pod_topics"("id");

-- CreateIndex
CREATE INDEX "pod_history_idx" ON "pod_history"("id", "fk_pod_topic_id");

-- AddForeignKey
ALTER TABLE "pod_history" ADD CONSTRAINT "fk_pod_topic_id" FOREIGN KEY ("fk_pod_topic_id") REFERENCES "pod_topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
