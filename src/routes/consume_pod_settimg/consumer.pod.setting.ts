import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';

import { 
    sendCreatePodSettingByGroup, 
    sendUpdatePodSettingByGroup
} from './publish.to..queue';


dotenv.config(); 

const createExchangeName  = process.env.CREATE_POD_SETTING_EXCHANGE;
const updateExchangeName  = process.env.UPDATE_POD_SETTING_EXCHANGE;
const connectionUrl = process.env.RABBITMQ_URL;

const consumePodSetting = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add pod setting data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    console.log("ini adalah data yang didapat dari admin: ", data);

                    const { experience_id, pod_id, newDetails } = data;

                    if (!experience_id || !pod_id || !Array.isArray(newDetails)) {
                        throw new Error("Invalid message format");
                    }

                    const existPodId = await prisma.pod.findUnique({
                        where: {
                            id: pod_id
                        }
                    })

                    const existExperiences = await prisma.experiences.findUnique({
                        where: {
                            id: experience_id
                        }
                    })
                    // console.log("ini adalah exist experience: ", existExperiences);

                    if (existPodId && existExperiences) {
                        for (const detail of newDetails) {
                            const {
                                id,
                                stroboscopic_light,
                                audio_surround_sound,
                                vibro_acoustics,
                                led_intensity,
                                led_color,
                                infra_red_nea_ir,
                                infra_red_far_ir,
                                pemf_therapy,
                                olfactory_engagement,
                                binaural_beats_isochronic_tones,
                                direct_neutral_stimulation,
                                duration,
                                song,
                                video,
                                lamp,
                                sound_scape,
                                scent,
                                burst_time
                            } = detail;

                            const newDetail = await prisma.detail_experience2.upsert({
                                where: { id },
                                update: {
                                    stroboscopic_light,
                                    audio_surround_sound,
                                    vibro_acoustics,
                                    led_intensity,
                                    led_color,
                                    infra_red_nea_ir,
                                    infra_red_far_ir,
                                    pemf_therapy,
                                    olfactory_engagement,
                                    binaural_beats_isochronic_tones,
                                    direct_neutral_stimulation,
                                    duration,
                                    song,
                                    video,
                                    lamp,
                                    sound_scape,
                                    scent,
                                },
                                create: {
                                    id,
                                    experience_id,
                                    stroboscopic_light,
                                    audio_surround_sound,
                                    vibro_acoustics,
                                    led_intensity,
                                    led_color,
                                    infra_red_nea_ir,
                                    infra_red_far_ir,
                                    pemf_therapy,
                                    olfactory_engagement,
                                    binaural_beats_isochronic_tones,
                                    direct_neutral_stimulation,
                                    duration,
                                    song,
                                    video,
                                    lamp,
                                    sound_scape,
                                    scent,
                                },
                            });

                            console.log(`✅ Detail Experience ID ${newDetail.id} saved successfully`);

                            if (Array.isArray(burst_time)) {
                                const burstData = burst_time.map(({ id, start_time, duration }) => ({
                                    id: id || undefined,
                                    fk_detail_experience: newDetail.id,
                                    start_time,
                                    duration
                                }));
    
                                for (const burst of burstData) {
                                    const existBurstTimeData = await prisma.burst_time.findMany({
                                        where: {
                                            id: burst.id
                                        }
                                    })
                                    if (existBurstTimeData.length === 0) {
                                        const createBurst = await prisma.burst_time.createMany({
                                            data : {
                                                id: burst.id, 
                                                start_time           : burst.start_time,
                                                duration             : burst.duration,
                                                fk_detail_experience : newDetail.id,
                                                updated_at           : new Date()
                                            }
                                        });
                                        console.log("burst time created", createBurst);
                                    } else {
                                        const updateBurst = await prisma.burst_time.updateMany({
                                            where: { id: burst.id },
                                            data : {
                                                
                                                start_time           : burst.start_time,
                                                duration             : burst.duration,
                                                fk_detail_experience : newDetail.id,
                                                updated_at           : new Date()
                                            }
                                        });
                                        console.log("burst time updated", updateBurst);
                                    }
                                }
                            }

                        }
                        console.log("\x1b[32m✅ Detail experience data successfully inserted into database\x1b[0m");

                        console.log("\x1b[32m✅ create new experience to metadata...\x1b[0m");
                        channel.ack(msg);
                    } else {
                        console.log("detail experience data is not for this pod, skip create detail experience");
                    }

                } catch (error) {
                    console.error('\x1b[31mError processing message:', error, '\x1b[0m');
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

const consumeUpdatePodSetting = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${updateExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updateExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update pod setting data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data yang didapatkan dari admin: ", data.detail_experience);

                const { experience_id, detail_experience, group_ids } = data;
                if (!experience_id || !Array.isArray(detail_experience) || !group_ids) {
                    console.error("\x1b[31m⚠️ Invalid message format:\x1b[0m", data);
                    throw new Error("Invalid message format");
                }

                const podDataByGroup = await prisma.pod.findMany({
                    where: {
                        group: {
                            id: { in: group_ids }
                        }
                    }
                });

                const podIdByGroupId = podDataByGroup.map(data => data.id)
                const experienceLinkClass = data.experienceLinkClass

                // console.log("ini adalah data pod id by group: ", podDataByGroup);
                // console.log("experienceLinkClass", experienceLinkClass);
                const experienceByPod = await prisma.experiences2.findMany({
                    where: {
                        pod_id: {
                            in: podIdByGroupId
                        }, 
                        link_class: {
                            in: experienceLinkClass
                        }
                    }
                })
                // console.log("experienceByPod", experienceByPod);

                // data yang perlu di update: 
                const ExpId = experienceByPod.map(detailExpId => detailExpId.id)
                const detailExpUpdate = await prisma.detail_experience2.findMany({
                    where: {
                        experience_id: {
                            in: ExpId
                        }
                    }
                })

                // ini adalah id detail exp yang perlu di update
                const detailExpId = detailExpUpdate.map(detailExpId => detailExpId.id)

                // TODO : 2 simpan data yang didapatkan berdasarkan group id
                await prisma.detail_experience2.updateMany({
                    where: {
                        id: {
                            in: detailExpId
                        }
                    },
                    data: {
                        stroboscopic_light: detail_experience[0].stroboscopic_light,
                        audio_surround_sound: detail_experience[0].audio_surround_sound,
                        vibro_acoustics: detail_experience[0].vibro_acoustics,
                        led_intensity: detail_experience[0].led_intensity,
                        led_color: detail_experience[0].led_color,
                        sound_scape: detail_experience[0].sound_scape,
                        infra_red_nea_ir: detail_experience[0].infra_red_nea_ir,
                        infra_red_far_ir: detail_experience[0].infra_red_far_ir,
                        pemf_therapy: detail_experience[0].pemf_therapy,
                        olfactory_engagement: detail_experience[0].olfactory_engagement,
                        binaural_beats_isochronic_tones: detail_experience[0].binaural_beats_isochronic_tones,
                        direct_neutral_stimulation: detail_experience[0].direct_neutral_stimulation,
                        duration: detail_experience[0].duration,
                        scent: detail_experience[0].scent,
                        song: detail_experience[0].song,
                        lamp: detail_experience[0].lamp,
                        video: detail_experience[0].video
                    }
                });

                const message = {
                    detail_experience: data.detail_experience,
                    experienceLinkClass: data.experienceLinkClass, 
                    detailExpId: detailExpId
                }

                console.log("ini adalah message yang akan dikirim ke admin dan ke pod: ", message);

                await sendUpdatePodSettingByGroup(message)

                // TODO: pantulkan data ke admin, baru setelah itu di sebar ke semua pod yang sesuai

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31m❌ Error processing message:\x1b[0m', error.message);
                channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error('\x1b[31m❌ Error initializing consumer:\x1b[0m', error);
    }
};

export {
    consumePodSetting, 
    consumeUpdatePodSetting
}
