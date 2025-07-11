import amqp from 'amqplib';
import dotenv from 'dotenv';
import prisma from '../../../prisma/prisma';
import {
    bounceExperienceData
} from './publish.to..queue';

dotenv.config();

const connectionUrl = `${process.env.RABBITMQ_URL}`;
const replaceExperienceDataGroup  = `${process.env.REPLACE_EXPERIENCE_DATA_GROUP}`;

const consumeReplaceExperienceData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(replaceExperienceDataGroup, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, replaceExperienceDataGroup, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (synch replace experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    const group_ids = data.group_ids

                    // 1. Ambil Pod berdasarkan group_ids
                    const matchPodData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: { in: group_ids }
                        }
                    });
                    const podIds = matchPodData.map(p => p.id);

                    // 2. Ambil experience berdasarkan pod
                    const matchExpId = await prisma.experiences2.findMany({
                        where: {
                            pod_id: { in: podIds }
                        }
                    });
                    const expIdData = matchExpId.map(e => e.id);

                    // 3. Ambil detail_experience berdasarkan experience
                    const matchDetailExpData = await prisma.detail_experience2.findMany({
                        where: {
                            experience_id: { in: expIdData }
                        }
                    });
                    const matchDetailId = matchDetailExpData.map(d => d.id);

                    // 4. Ambil burst_time berdasarkan detail_experience
                    const matchBurstTimeData = await prisma.burst_time.findMany({
                        where: {
                            fk_detail_experience: { in: matchDetailId }
                        }
                    });
                    const burstTimeId = matchBurstTimeData.map(b => b.id);

                    const matchFrequencyData = await prisma.generator_frequency.findMany({
                        where: {
                            fk_detail_experience: { in: matchDetailId }
                        }
                    });
                    const frequencyId = matchFrequencyData.map(b => b.id);

                    // 5. Hapus dengan aman, hanya jika ada data
                    let deleteBurstTime = { count: 0 };
                    if (burstTimeId.length > 0) {
                        deleteBurstTime = await prisma.burst_time.deleteMany({
                            where: {
                                id: { in: burstTimeId }
                            }
                        });
                    }

                    let deleteFrequency = { count: 0 };
                    if (frequencyId.length > 0) {
                        deleteFrequency = await prisma.generator_frequency.deleteMany({
                            where: {
                                id: { in: frequencyId }
                            }
                        });
                    }

                    let deleteDetailExperienceData = { count: 0 };
                    if (matchDetailId.length > 0) {
                        deleteDetailExperienceData = await prisma.detail_experience2.deleteMany({
                            where: {
                                id: { in: matchDetailId }
                            }
                        });
                    }

                    let deleteExpData = { count: 0 };
                    if (expIdData.length > 0) {
                        deleteExpData = await prisma.experiences2.deleteMany({
                            where: {
                                id: { in: expIdData }
                            }
                        });
                    }

                    // console.log({
                    //     message: "data deleted",
                    //     deleteBurstTime,
                    //     deleteFrequency, 
                    //     deleteDetailExperienceData,
                    //     deleteExpData
                    // });

                    console.log({
                        message: "data deleted", 
                        deleteBurstTime: deleteBurstTime, 
                        deleteFrequency: deleteFrequency, 
                        deleteDetailExperienceData: deleteDetailExperienceData, 
                        deleteExpData: deleteExpData
                    });

                    const experienceData = data.data.map((data: any) => ({
                        id: data.id, 
                        link_class: data.link_class ,
                        icon_class: data.icon_class,
                        icon_name: data.icon_name,
                        menu_name: data.menu_name,
                        information: data.information,
                        active: data.active,
                        created_date: data.created_date,
                    }));

                    const detailExperienceData: any[] = [];
                    data.data.forEach((experience: any) => {
                        if (Array.isArray(experience.detail_experience)) {
                            experience.detail_experience.forEach((detail: any) => {
                                const detailExpData = {
                                    id: detail.id, 
                                    stroboscopic_light: detail.stroboscopic_light,
                                    audio_surround_sound: detail.audio_surround_sound,
                                    vibro_acoustics: detail.vibro_acoustics,
                                    led_intensity: detail.led_intensity,
                                    led_color: detail.led_color,
                                    sound_scape: detail.sound_scape,
                                    infra_red_nea_ir: detail.infra_red_nea_ir,
                                    infra_red_far_ir: detail.infra_red_far_ir,
                                    pemf_therapy: detail.pemf_therapy,
                                    olfactory_engagement: detail.olfactory_engagement,
                                    binaural_beats_isochronic_tones: detail.binaural_beats_isochronic_tones,
                                    direct_neutral_stimulation: detail.direct_neutral_stimulation,
                                    duration: detail.duration,
                                    scent: detail.scent,
                                    uva: detail.uva,
                                    uvb: detail.uvb,
                                    uvc: detail.uvc,
                                    pemf_value: detail.pemf_value,
                                    lamp: detail.lamp,
                                    song: detail.song,
                                    video: detail.video,
                                }
                                detailExperienceData.push(detailExpData);
                            });
                        }
                    });

                    const burstData: any[] = [];
                    data.data.forEach((experience: any) => {
                        experience.detail_experience?.forEach((detail: any) => {
                            detail.burst_time?.forEach((burst: any) => {
                                const burstTimeData = {
                                    id: burst.id,
                                    fk_detail_experience: burst.fk_detail_experience, 
                                    start_time: burst.start_time, 
                                    duration: burst.duration
                                } 
                                burstData.push(burstTimeData);
                            });
                        });
                    });

                    const frequencyDatas: any[] = [];
                    data.data.forEach((experience: any) => {
                        experience.detail_experience?.forEach((detail: any) => {
                            detail.generator_frequency?.forEach((frequency: any) => {
                                const frequencyData = {
                                    id: frequency.id,
                                    frequency: frequency.frequency, 
                                    fk_detail_experience: frequency.fk_detail_experience, 
                                    start_time: frequency.start_time, 
                                    duration: frequency.duration
                                } 
                                frequencyDatas.push(frequencyData);
                            });
                        });
                    });

                    const results = [];
                    for (const podId of podIds) {
                        for (let i = 0; i < experienceData.length; i++) {
                            const exp = experienceData[i];
                            const detail = detailExperienceData[i];

                            // Skip jika detail tidak tersedia
                            if (!detail) {
                                console.warn(`Skipped experience ${exp.id} because it has no detail_experience`);
                                continue;
                            }

                            const bursts = burstData.filter(b => b.fk_detail_experience === detail.id);
                            const frequency = frequencyDatas.filter(b => b.fk_detail_experience === detail.id);

                            try {
                                const createExperience = await prisma.experiences2.create({
                                    data: {
                                        pod_id: podId,
                                        link_class: exp.link_class,
                                        icon_class: exp.icon_class,
                                        icon_name: exp.icon_name,
                                        menu_name: exp.menu_name,
                                        information: exp.information,
                                        active: exp.active,
                                        created_date: exp.created_date,
                                    },
                                });

                                const createDetail = await prisma.detail_experience2.create({
                                    data: {
                                        stroboscopic_light: detail.stroboscopic_light,
                                        audio_surround_sound: detail.audio_surround_sound,
                                        vibro_acoustics: detail.vibro_acoustics,
                                        led_intensity: detail.led_intensity,
                                        led_color: detail.led_color,
                                        sound_scape: detail.sound_scape,
                                        infra_red_nea_ir: detail.infra_red_nea_ir,
                                        infra_red_far_ir: detail.infra_red_far_ir,
                                        pemf_therapy: detail.pemf_therapy,
                                        olfactory_engagement: detail.olfactory_engagement,
                                        binaural_beats_isochronic_tones: detail.binaural_beats_isochronic_tones,
                                        direct_neutral_stimulation: detail.direct_neutral_stimulation,
                                        duration: detail.duration,
                                        experiences: { connect: { id: createExperience.id } },
                                        pemf_value: detail.pemf_value,
                                        scent: detail.scent,
                                        lamp: detail.lamp,
                                        song: detail.song,
                                        video: detail.video
                                    },
                                });

                                const createdBursts = [];
                                for (const burst of bursts) {
                                    try {
                                        const created = await prisma.burst_time.create({
                                            data: {
                                                start_time: burst.start_time,
                                                duration: burst.duration,
                                                fk_detail_experience: createDetail.id,
                                            },
                                        });
                                        createdBursts.push(created);
                                    } catch (e) {
                                        console.error("error burst create:", e);
                                    }
                                }

                                const createFrequency = [];
                                for (const frequenc of frequency) {
                                    try {
                                        const createdFrequency = await prisma.generator_frequency.create({
                                            data: {
                                                frequency: frequenc.frequency,
                                                start_time: frequenc.start_time,
                                                duration: frequenc.duration,
                                                fk_detail_experience: createDetail.id,
                                            },
                                        });
                                        createFrequency.push(createdFrequency);
                                    } catch (e) {
                                        console.error("error burst create:", e);
                                    }
                                }

                                results.push({
                                    experience: createExperience,
                                    detail_experience: createDetail,
                                    burst_times: createdBursts, 
                                    generator_frequency: createFrequency
                                });

                            } catch (err) {
                                console.error(`Error processing experience+detail+burst for pod ${podId}:`, err);
                            }
                        }
                    }

                    const message = {
                        data: results, 
                        group_ids: group_ids, 
                        podIds: podIds
                    }

                    console.log("data created", results.length);

                    await bounceExperienceData(message)

                    channel.ack(msg);
                } catch (error: any) {
                    console.error('❌ Error processing message:', error.message);
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error) {
        console.error('❌ Error initializing consumer:', error);
    }
};

export {
    consumeReplaceExperienceData
};
