/*
  Warnings:

  - You are about to drop the `global_setting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "global_setting" DROP CONSTRAINT "global_setting_pod_id_fkey";

-- DropTable
DROP TABLE "global_setting";

-- CreateTable
CREATE TABLE "global_setting2" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pod_id" UUID,
    "app_timeout" INTEGER,
    "default_volume" INTEGER,
    "pob_threshold" INTEGER,
    "pob_timeout_login" INTEGER,
    "pob_pitch_offset" INTEGER,
    "code_number" INTEGER,
    "rgb_value" TEXT,
    "default_volume_tunnel" INTEGER,
    "default_volume_guide" INTEGER,
    "nir" INTEGER,
    "pemf" INTEGER,
    "uva_enable" BOOLEAN NOT NULL DEFAULT false,
    "uvb_enable" BOOLEAN NOT NULL DEFAULT false,
    "uvc_enable" BOOLEAN NOT NULL DEFAULT false,
    "dissable_full_mode" BOOLEAN NOT NULL DEFAULT false,
    "session_mode" BOOLEAN NOT NULL DEFAULT false,
    "work_rest_play" BOOLEAN NOT NULL DEFAULT false,
    "self_develepment" BOOLEAN NOT NULL DEFAULT false,
    "demo_mode" BOOLEAN NOT NULL DEFAULT false,
    "dissable_lite_mode" BOOLEAN NOT NULL DEFAULT false,
    "dissable_bluetooth" BOOLEAN NOT NULL DEFAULT false,
    "fir_temprature" INTEGER,
    "idle_track_repeat" BOOLEAN NOT NULL DEFAULT false,
    "idle_track_volume" INTEGER,
    "lamp_intensity" INTEGER,
    "led_aniation" BOOLEAN NOT NULL DEFAULT false,
    "led_intentsity" INTEGER,
    "pod_pitch" INTEGER,
    "strobe_intensity" INTEGER,
    "temperature" INTEGER,
    "playing_track" INTEGER,
    "uva" INTEGER,
    "uvb" INTEGER,
    "uvc" INTEGER,
    "vibration" INTEGER,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "global_setting2_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "global_setting2" ADD CONSTRAINT "global_setting2_pod_id_fkey" FOREIGN KEY ("pod_id") REFERENCES "pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
