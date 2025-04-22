-- CreateTable
CREATE TABLE "pod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "identification" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "latitude" TEXT,
    "longitude" TEXT,
    "pod_version" TEXT,
    "server_version" TEXT,
    "mac_address_bluetooth" TEXT NOT NULL,
    "mac_address_pod" TEXT NOT NULL,
    "soundcard_name" TEXT,
    "amplifier" TEXT,
    "start_deploy" TIMESTAMP(3),
    "serial_number" TEXT,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "pod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences2" (
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

    CONSTRAINT "experiences2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_experience2" (
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
    "lamp" TEXT,
    "sound_scape" INTEGER NOT NULL,
    "scent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "detail_experience2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "olfactory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scent" INTEGER NOT NULL,
    "scen_aroma" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "olfactory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "burst_time" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "start_time" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "fk_detail_experience" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "burst_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "button_name" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "mode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pod_mac_address_bluetooth_key" ON "pod"("mac_address_bluetooth");

-- CreateIndex
CREATE UNIQUE INDEX "pod_mac_address_pod_key" ON "pod"("mac_address_pod");

-- CreateIndex
CREATE UNIQUE INDEX "olfactory_scent_key" ON "olfactory"("scent");

-- AddForeignKey
ALTER TABLE "experiences2" ADD CONSTRAINT "experiences2_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "mode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences2" ADD CONSTRAINT "experiences2_pod_id_fkey" FOREIGN KEY ("pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_experience2" ADD CONSTRAINT "detail_experience2_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burst_time" ADD CONSTRAINT "burst_time_fk_detail_experience_fkey" FOREIGN KEY ("fk_detail_experience") REFERENCES "detail_experience2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
