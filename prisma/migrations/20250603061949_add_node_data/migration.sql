-- CreateTable
CREATE TABLE "node" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "label" TEXT,
    "type" TEXT,
    "position_x" INTEGER,
    "position_y" INTEGER,
    "inputs" TEXT,
    "pod_id" UUID,
    "pob_state" BOOLEAN DEFAULT false,
    "template_style" JSONB,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_button" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "button_code" TEXT,
    "name" TEXT,
    "output_number" TEXT,
    "fk_node_id" UUID,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "node_button_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes_output" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nodes_code" TEXT,
    "side" TEXT,
    "class" TEXT,
    "fk_node_id" UUID,
    "output_code" TEXT,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "nodes_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from" TEXT,
    "to" TEXT,
    "code" TEXT,
    "fk_node_id" UUID,
    "updated_date" TIMESTAMPTZ(6),
    "created_date" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "node_code_key" ON "node"("code");

-- CreateIndex
CREATE UNIQUE INDEX "node_button_button_code_key" ON "node_button"("button_code");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_output_nodes_code_key" ON "nodes_output"("nodes_code");

-- CreateIndex
CREATE UNIQUE INDEX "connections_code_key" ON "connections"("code");

-- AddForeignKey
ALTER TABLE "node" ADD CONSTRAINT "node_pod_id_fkey" FOREIGN KEY ("pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_button" ADD CONSTRAINT "node_button_fk_node_id_fkey" FOREIGN KEY ("fk_node_id") REFERENCES "node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes_output" ADD CONSTRAINT "nodes_output_fk_node_id_fkey" FOREIGN KEY ("fk_node_id") REFERENCES "node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_fk_node_id_fkey" FOREIGN KEY ("fk_node_id") REFERENCES "node"("id") ON DELETE SET NULL ON UPDATE CASCADE;
