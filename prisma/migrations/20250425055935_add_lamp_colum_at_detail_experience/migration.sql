-- AlterTable
ALTER TABLE "detail_experience" ADD COLUMN     "lamp" TEXT,
ALTER COLUMN "stroboscopic_light" DROP NOT NULL,
ALTER COLUMN "audio_surround_sound" DROP NOT NULL,
ALTER COLUMN "vibro_acoustics" DROP NOT NULL,
ALTER COLUMN "led_intensity" DROP NOT NULL,
ALTER COLUMN "led_color" DROP NOT NULL,
ALTER COLUMN "infra_red_nea_ir" DROP NOT NULL,
ALTER COLUMN "infra_red_far_ir" DROP NOT NULL,
ALTER COLUMN "pemf_therapy" DROP NOT NULL,
ALTER COLUMN "olfactory_engagement" DROP NOT NULL,
ALTER COLUMN "binaural_beats_isochronic_tones" DROP NOT NULL,
ALTER COLUMN "direct_neutral_stimulation" DROP NOT NULL,
ALTER COLUMN "sound_scape" DROP NOT NULL;
