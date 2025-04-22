import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from  "dotenv"
// import { updateSignal } from '../../processor/flow'
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios";
dotenv.config(); 

const exchangeName  = `${process.env.POD_EXCHANGE_CREATE}`;
const connectionUrl = process.env.RABBITMQ_URL;
const podUrl        = process.env.POD_URL;

const fetchInitialPodData = async () => { 
    try {
        const token = await loginToAdmin();

        if (!token) {
            throw new Error("Login failed, token is undefined.");
        }

        const podResponse = await axios.get(`${podUrl}/pod-managemenent`, {
            headers: { "Authorization": `${token}` }
        });

        const result = podResponse.data;

        if (!result || !Array.isArray(result.data)) {
            throw new Error('Unexpected pod data format: "data" is not an array');
        }

        const initialData = result.data;

        if (initialData.length === 0) {
            console.log("Database admin is empty", initialData.length);
            return;
        }

        for (const matchData of initialData) {
            const existFirmware = await prisma.firmware_version.findMany({
                where: { id: matchData.firmware_version.id }
            });

            if (existFirmware.length === 0) {
                await prisma.firmware_version.create({
                    data: {
                        id: matchData.fk_firmware_version,
                        firmware_id: matchData.firmware_version.firmware_id,
                        light_version: matchData.firmware_version.light_version,
                        chair_version: matchData.firmware_version.chair_version,
                        olvactory_version: matchData.firmware_version.olvactory_version,
                        manual_controll_version: matchData.firmware_version.manual_controll_version,
                        air_condition_version: matchData.firmware_version.air_condition_version,
                        volume_controll_version: matchData.firmware_version.volume_controll_version,
                        door_version: matchData.firmware_version.door_version
                    }
                });
            } else {
                await prisma.firmware_version.update({
                    where: { id: matchData.firmware_version.id },
                    data: {
                        firmware_id: matchData.firmware_version.firmware_id,
                        light_version: matchData.firmware_version.light_version,
                        chair_version: matchData.firmware_version.chair_version,
                        olvactory_version: matchData.firmware_version.olvactory_version,
                        manual_controll_version: matchData.firmware_version.manual_controll_version,
                        air_condition_version: matchData.firmware_version.air_condition_version,
                        volume_controll_version: matchData.firmware_version.volume_controll_version,
                        door_version: matchData.firmware_version.door_version
                    }
                });
            }

            // Proses customer
            const existCustomer = await prisma.customer.findMany({
                where: {
                    id: matchData.customer.id
                }
            });

            if (existCustomer.length === 0) {
                await prisma.customer.create({
                    data: {
                        id: matchData.customer.id,
                        address: matchData.customer.address,
                        description: matchData.customer.description,
                        phone: matchData.customer.phone
                    }
                });
            } else {
                await prisma.customer.update({
                    where: { id: matchData.customer.id },
                    data: {
                        address: matchData.customer.address,
                        description: matchData.customer.description,
                        phone: matchData.customer.phone
                    }
                });
            }

            // Proses pod
            const existPod = await prisma.pod.findMany({
                where: {
                    mac_address_pod: matchData.mac_address_pod
                }
            });

            if (existPod.length === 0) {
                await prisma.pod.create({
                    data: {
                        id: matchData.id,
                        fk_group_id: matchData.fk_group_id,
                        fk_app_version: matchData.fk_app_version,
                        fk_firmware_version: matchData.fk_firmware_version,
                        fk_customer: matchData.fk_customer,
                        code: matchData.code,
                        name: matchData.name,
                        url: matchData.url,
                        pod_version: matchData.pod_version,
                        identification: matchData.identification,
                        ip_address: matchData.ip_address,
                        latitude: matchData.coordinate.latitude,
                        longitude: matchData.coordinate.longitude,
                        server_version: matchData.server_version,
                        mac_address_bluetooth: matchData.mac_address_bluetooth,
                        mac_address_pod: matchData.mac_address_pod,
                        soundcard_name: matchData.soundcard_name,
                        amplifier: matchData.amplifier,
                        start_deploy: matchData.start_deploy,
                        serial_number: matchData.serial_number
                    }
                });
            } else {
                await prisma.pod.update({
                    where: { mac_address_pod: matchData.mac_address_pod },
                    data: {
                        fk_group_id: matchData.fk_group_id,
                        fk_app_version: matchData.fk_app_version,
                        fk_firmware_version: matchData.fk_firmware_version,
                        fk_customer: matchData.fk_customer,
                        code: matchData.code,
                        name: matchData.name,
                        url: matchData.url,
                        pod_version: matchData.pod_version,
                        identification: matchData.identification,
                        ip_address: matchData.ip_address,
                        latitude: matchData.coordinate.latitude,
                        longitude: matchData.coordinate.longitude,
                        server_version: matchData.server_version,
                        mac_address_bluetooth: matchData.mac_address_bluetooth,
                        soundcard_name: matchData.soundcard_name,
                        amplifier: matchData.amplifier,
                        start_deploy: matchData.start_deploy,
                        serial_number: matchData.serial_number
                    }
                });
            }

            const experienceResponse = await axios.get(`${podUrl}/pod-setting/detail/${matchData.id}`, {
                headers: {
                    "Authorization": `${token}`,
                }
            });

            const podData = experienceResponse.data?.data?.pod;

            if (!podData || !Array.isArray(podData.experiences)) {
                throw new Error("Unexpected response format: 'experiences' is missing or not an array.");
            }

            const experience = podData.experiences.map((exp: any) => ({
                id: exp.id,
                pod_id: matchData.id,
                link_class: exp.link_class,
                icon_class: exp.icon_class,
                icon_name: exp.icon_name,
                menu_name: exp.menu_name,
                information: exp.information,
                active: exp.active
            }));

            const detailExperience = podData.experiences.flatMap((exp: any) =>
                exp.detail_experience?.map((detailExp: any) => ({
                    id: detailExp.id,
                    experience_id: exp.id,
                    stroboscopic_light: detailExp.stroboscopic_light,
                    audio_surround_sound: detailExp.audio_surround_sound,
                    vibro_acoustics: detailExp.vibro_acoustics,
                    led_intensity: detailExp.led_intensity,
                    led_color: detailExp.led_color,
                    sound_scape: detailExp.sound_scape,
                    infra_red_nea_ir: detailExp.infra_red_nea_ir,
                    infra_red_far_ir: detailExp.infra_red_far_ir,
                    pemf_therapy: detailExp.pemf_therapy,
                    olfactory_engagement: detailExp.olfactory_engagement,
                    binaural_beats_isochronic_tones: detailExp.binaural_beats_isochronic_tones,
                    direct_neutral_stimulation: detailExp.direct_neutral_stimulation,
                    duration: detailExp.duration,
                    song: detailExp.song,
                    video: detailExp.video
                })) || []
            );

            const existExperience = await prisma.experiences2.findMany({
                where: {
                    pod_id: matchData.id
                }
            });

            // console.log("exist detail experience: ", detailExperience);

            if (existExperience.length === experience.length) {
                await Promise.all(
                    experience.map(async (exp: any) => {
                        await prisma.experiences2.update({
                            where: { id: exp.id },
                            data: exp
                        });
                    })
                );
            } else {
                await prisma.experiences2.createMany({
                    data: experience,
                    skipDuplicates: true
                });
                // console.log('\x1b[32m' + "experience synchronized successfully" + '\x1b[0m');
            }

            if (detailExperience.length > 0) {
                await prisma.detail_experience2.createMany({
                    data: detailExperience,
                    skipDuplicates: true
                });
                // console.log('\x1b[32m' + "detail experience synchronized successfully" + '\x1b[0m');
            }

            const selfDevData = await axios.get(`${podUrl}/self/development/${matchData.id}`, {
                headers: { "Authorization": `${token}` }
            });

            const rawData = selfDevData.data?.data || [];

            const existSelfDev = await prisma.self_development2.findMany({
                where: { fk_pod_id: matchData.id }
            });

            const transformedData = rawData.map((item: any) => ({
                id: item.id,
                fk_pod_id: matchData.id,
                self_development_name: item.self_development_name,
                description: item.description,
                icon: item.icon || null
            }));

            // console.log("Transformed Data: ", transformedData);

            const existingIds = new Set(existSelfDev.map(item => item.id));
            const newData = transformedData.filter((item: any) => !existingIds.has(item.id));
            const updateData = transformedData.filter((item: any) => existingIds.has(item.id));

            let newSelfDevIds = [];

            if (newData.length > 0) {
                const createdSelfDev = await Promise.all(
                    newData.map(async (item: any) => {
                        const created = await prisma.self_development2.create({
                            data: item,
                            select: { id: true }
                        });
                        return created.id;
                    })
                );

                newSelfDevIds = createdSelfDev;
                // console.log("Self development data created:", newSelfDevIds.length);
            }

            if (updateData.length > 0) {
                await Promise.all(updateData.map((item: any) =>
                    prisma.self_development2.update({
                        where: { id: item.id },
                        data: {
                            self_development_name: item.self_development_name,
                            description: item.description,
                            icon: item.icon || null
                        }
                    })
                ));
                // console.log("Self development data updated:", updateData.length);
            }

            const idSelfDev = rawData.map((item: any) => item.id);
            // console.log("ID Self Dev:", idSelfDev);

            let allSoundData: any[] = [];

            for (const selfDevId of idSelfDev) {
                try {
                    const selfDevSoundData = await axios.get(`${podUrl}/self/development/${matchData.id}/${selfDevId}`, {
                        headers: { "Authorization": `${token}` }
                    });

                    const rawSoundData = selfDevSoundData.data?.data?.[0]?.sound || [];
                    // console.log(`Raw Sound Data for ${selfDevId}:`, rawSoundData.length);

                    const transformedSoundData = rawSoundData.map((item: any) => ({
                        id: item.id,
                        self_development_id: item.self_development_id,
                        sound_code: item.sound_scape,
                        title: item.title,
                        duration: item.duration,
                        description: item.description,
                        sound_path: item.music,
                        file_path: item.lamp,
                        caption: item.caption,
                        created_date: item.created_date,
                        updated_date: item.updated_date
                    }));

                    allSoundData = allSoundData.concat(transformedSoundData);
                } catch (error: any) {
                    console.error(`Error fetching sound data for ${selfDevId}:`, error.message);
                }
            }

            if (allSoundData.length > 0) {
                await prisma.self_development_sound2.createMany({
                    data: allSoundData,
                    skipDuplicates: true
                });
                // console.log("Self development sound data created:", allSoundData.length);
            }
        }

        console.log('\x1b[32m' + "Pod data synchronized successfully" + '\x1b[0m');

    } catch (error: any) {
        console.error('Failed to synchronize data:', error.message);
    }
};

export {
    fetchInitialPodData, 
}
