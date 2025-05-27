import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';

import { 
    sendCreatePodSettingByGroup, 
    sendUpdatePodSettingByGroup, 
    sendDeletePodSettingByGroup
} from './publish.to..queue';

dotenv.config(); 

const connectionUrl = process.env.RABBITMQ_URL;
const createExchangeName  = process.env.CREATE_POD_SETTING_EXCHANGE;
const updateExchangeName  = process.env.UPDATE_POD_SETTING_EXCHANGE;
const deleteExchangeName  = process.env.DELETE_POD_SETTING_EXCHANGE;
const createPodSettingByGroupSendExchange  = process.env.CREATE_POD_SETTING_BY_GROUP_SEND_EXCHANGE;
const updatePodSettingByGroupSendExchange  = process.env.UPDATE_POD_SETTING_BY_GROUP_SEND_EXCHANGE;
const deletePodSettingByGroupSendExchange  = `${process.env.DELETE_POD_SETTING_BY_GROUP_SEND_EXCHANGE}`;

const consumeCreatePodSetting = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync create pod setting data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    console.log("ini adalah data yang didapat dari admin: ", data);

                    const { experience_id, pod_id,  detail_experience } = data;

                    if (!experience_id || !pod_id || !Array.isArray( detail_experience)) {
                        throw new Error("Invalid message format");
                    }

                    const existPodId = await prisma.pod.findUnique({
                        where: {
                            id: pod_id
                        }
                    })

                    console.log("ini adalah pod data : ", existPodId);

                    const existExperiences = await prisma.experiences2.findUnique({
                        where: {
                            id: experience_id
                        }
                    })
                    console.log("ini adalah exist experience: ", existExperiences);

                    for (const detail of detail_experience) {
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

                    channel.ack(msg);
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

const consumeDeletePodSetting = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync delete pod setting data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    // console.log("ini adalah data yang didapat dari admin: ", data);

                    const detailId = data.detailId
                    const order = data.order
                    const order_experience = data.order_experience
                    const group_ids = data.group_ids

                    const deleteDetailExperience = await prisma.detail_experience2.deleteMany({
                        where: {
                            id: detailId, 
                            order: {in: order}, 
                            order_experience: {in: order_experience}
                        }
                    })

                    console.log("detail Experience deleted", deleteDetailExperience);

                    channel.ack(msg);
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

const consumeUpdatePodSettingGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${updatePodSettingByGroupSendExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updatePodSettingByGroupSendExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update pod setting data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data yang didapatkan dari admin: ", data);

                const experience_id = data.experience_id 
                const detail_experience = data.detail_experience 
                const group_ids = data.group_ids  
                const experienceLinkClass = data.experienceLinkClass
                const experienceOrder = data.experienceOrder
                const detailId = data.detail_experience[0].id

                console.log("detail id: ", detailId);

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

                const experienceByPod = await prisma.experiences2.findMany({
                    where: {
                        pod_id: {
                            in: podIdByGroupId
                        }, 
                        order_experience: experienceOrder[0]
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

                const directUpdate = await prisma.detail_experience2.updateMany({
                    where: {
                        id: detailId.toString()
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
                        video: detail_experience[0].video, 
                        order: detail_experience[0].order
                    }
                })

                console.log("direct update: ", directUpdate);

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
                        video: detail_experience[0].video, 
                        order: detail_experience[0].order
                    }
                });

                // const burstTime = data.detail_experience[0].burst_time

                // console.log("ini adalah data burst time: ", burstTime);

                if (Array.isArray(detailExpId)) {
                    const templateDetail = detail_experience[0];
                
                    for (let i = 0; i < detailExpId.length; i++) {
                        const detailId = detailExpId[i];
                        const burst_time_list = templateDetail.burst_time || [];
                
                        await prisma.burst_time.deleteMany({
                            where: { fk_detail_experience: detailId }
                        });
                
                        for (const burst of burst_time_list) {
                            if (!burst.start_time || !burst.duration) continue;
                
                            await prisma.burst_time.create({
                                data: {
                                    start_time: burst.start_time,
                                    duration: burst.duration,
                                    fk_detail_experience: detailId,
                                    updated_at: new Date(),
                                },
                            });
                
                            console.log(`✅ Created burst_time [${burst.start_time}s - ${burst.duration}s] for detail_id: ${detailId}`);
                        }
                    }
                }

                const message = {
                    detail_experience: data.detail_experience,
                    experienceLinkClass: data.experienceLinkClass, 
                    detailExpId: detailExpId
                }

                console.log("ini adalah message yang akan dikirim ke admin dan ke pod: ", message);

                // TODO 3: pantulkan data ke admin, baru setelah itu di sebar ke semua pod yang sesuai
                await sendUpdatePodSettingByGroup(message)

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

const consumeCreatePodSettingGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createPodSettingByGroupSendExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createPodSettingByGroupSendExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync create pod setting data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                const { experience_id, detail_experience, group_ids } = data;
                if (!experience_id || !Array.isArray(detail_experience) || !group_ids) {
                    console.error("\x1b[31m⚠️ Invalid message format:\x1b[0m", data);
                    throw new Error("Invalid message format");
                }

                // 1. Dapatkan semua pod berdasarkan group_ids
                const podDataByGroup = await prisma.pod.findMany({
                    where: {
                        group: {
                            id: { in: group_ids }
                        }
                    }
                });

                const podIdByGroupId = podDataByGroup.map(data => data.id)
                const experienceLinkClass = data.experienceLinkClass

                // 2. Dapatkan semua experience yang sesuai dengan pod dan link class
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

                const ExpIds = experienceByPod.map(exp => exp.id)
                console.log("Daftar experience IDs yang akan diupdate:", ExpIds);

                // 3. Persiapkan data untuk createMany
                const detailExperienceData = ExpIds.map((expId: any) => {
                    return {
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
                        order_experience: detail_experience[0].order_experience, 
                        order: detail_experience[0].order, 
                        experience_id: expId,
                        duration: detail_experience[0].duration,
                        scent: detail_experience[0].scent,
                        song: detail_experience[0].song,
                        lamp: detail_experience[0].lamp,
                        video: detail_experience[0].video
                    }
                });

                // 4. Eksekusi createMany
                const createdDetails = await Promise.all(detailExperienceData.map(async (data) => {
                    return await prisma.detail_experience2.create({
                        data,
                        select: {
                            id: true
                        }
                    });
                }));

                console.log(`Berhasil membuat ${createdDetails} detail experience`);

                // 5. Handle burst_time untuk setiap detail experience yang baru dibuat
                if (detail_experience[0]?.burst_time?.length > 0) {
                    // Dapatkan semua detail experience yang baru dibuat
                    const newDetails = await prisma.detail_experience2.findMany({
                        where: {
                            experience_id: { in: ExpIds }
                        }
                    });

                    const burstTimeData = [];

                    for (const detail of newDetails) {
                        for (const burst of detail_experience[0].burst_time) {
                            if (!burst.start_time || !burst.duration) continue;
                            
                            burstTimeData.push({
                                start_time: burst.start_time,
                                duration: burst.duration,
                                fk_detail_experience: detail.id,
                                updated_at: new Date(),
                            });
                        }
                    }

                    // Gunakan createMany untuk burst_time juga
                    if (burstTimeData.length > 0) {
                        await prisma.burst_time.createMany({
                            data: burstTimeData
                        });
                        // console.log(`Berhasil membuat ${burstTimeData.length} burst time records`);
                    }
                }


                const detailId = createdDetails.map(expId => expId.id)

                const message = {
                    detail_experience: data.detail_experience,
                    experienceLinkClass: data.experienceLinkClass,
                    createdDetailsCount: createdDetails, 
                    experienceIds: ExpIds,
                    detailId: detailId
                }

                console.log(data.detail_experience);

                // console.log("Message yang akan dikirim:", message);

                await sendCreatePodSettingByGroup(message)

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

                console.log("ini adalah data yang didapatkan dari admin: ", data);

                const { experience_id, detail_experience } = data;
                if (!experience_id || !Array.isArray(detail_experience)) {
                    console.error("\x1b[31m⚠️ Invalid message format:\x1b[0m", data);
                    throw new Error("Invalid message format");
                }

                for (const detail of detail_experience) {
                    const { id: detailId, burst_time, ...restDetail } = detail;

                    const updatedDetail = detailId
                    ? await prisma.detail_experience2.update({
                        where: { id: detailId },
                        data: {
                            ...restDetail,
                            updated_at: new Date(),
                        },
                        select: { id: true }
                    })
                    : await prisma.detail_experience2.create({
                        data: {
                            experience_id: experience_id,
                            ...restDetail,
                        },
                        select: { id: true }
                    });

                    console.log(`✅ Detail Experience ID ${updatedDetail.id} saved successfully`);

                    if (Array.isArray(burst_time)) {
                        const burstData = burst_time.map(({ id, start_time, duration }) => ({
                            id: id || undefined,
                            fk_detail_experience: detailId,
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
                                        fk_detail_experience : detailId,
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
                                        fk_detail_experience : detailId,
                                        updated_at           : new Date()
                                    }
                                });
                                console.log("burst time updated", updateBurst);
                            }
                        }
                    }
                }

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

const consumeDeleteDetailExpByGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deletePodSettingByGroupSendExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deletePodSettingByGroupSendExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync delete pod setting data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    // console.log("ini adalah data yang didapat dari admin: ", data);

                    const detailId = data.detailId
                    const order = data.order
                    const order_experience = data.order_experience
                    const group_ids = data.group_ids

                    const getPodMatchData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })
                    const podIdsMatchGroup = getPodMatchData.map(id => id.id)
                    // console.log("match pod id by group: ", podIdsMatchGroup);

                    const getExpereinceMatch = await prisma.experiences2.findMany({
                        where: {
                            pod_id: {in: podIdsMatchGroup}
                        }
                    })
                    const experienceIdMathc = getExpereinceMatch.map(id => id.id)
                    // console.log("experience id match: ", experienceIdMathc);

                    const detailExperienceId = await prisma.detail_experience2.findMany({
                        where: {
                            experience_id: {in: experienceIdMathc}, 
                            order: {in: order}, 
                            order_experience: {in: order_experience}
                        }
                    })
                    const detailExpId = detailExperienceId.map(id => id.id) 
                    // console.log("data detail yang akan dihapus: ", detailExpId);

                    const message = {
                        pod_ids: podIdsMatchGroup, 
                        experience_ids: experienceIdMathc,  
                        detailExpId: detailExpId
                    }
                    // console.log("ini adalah message yang akan dikirim: ", message);

                    await sendDeletePodSettingByGroup(message)

                    const directDelete = await prisma.detail_experience2.delete({
                        where: {
                            id: detailId.toString()
                        }
                    })

                    console.log(directDelete);

                    const deleteDetailExperience = await prisma.detail_experience2.deleteMany({
                        where: {
                            id: {in: detailExpId}, 
                            order: {in: order}, 
                            order_experience: {in: order_experience}
                        }
                    })

                    console.log("detail Experience deleted by group", deleteDetailExperience);

                    channel.ack(msg);
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

export {
    consumeCreatePodSetting, 
    consumeUpdatePodSettingGroup,
    consumeCreatePodSettingGroup, 
    consumeDeleteDetailExpByGroup,
    consumeUpdatePodSetting, 
    consumeDeletePodSetting
}
