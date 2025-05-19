import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import {
    bounceCreateExperiences, 
    bounceUpdateExperiences, 
    bounceDeleteExperiences
} from './publish.to..queue';

dotenv.config(); 

const createExperienceDataGroup  = `${process.env.CREATE_EXPERIENCE_DATA_GROUP}`;
const updateExperienceDataGroup  = `${process.env.UPDATE_EXPERIENCE_DATA_GROUP}`;
const deleteExperienceDataGroup  = `${process.env.DELETE_EXPERIENCE_DATA_GROUP}`;

const connectionUrl = process.env.RABBITMQ_URL;

const consumeCreateExperiencesGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createExperienceDataGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createExperienceDataGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync create experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah daya yang didapat dari admin: ", data);

                const group_ids = data.group_ids

                const findPodByGroup = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {
                            in: group_ids
                        }
                    }
                })

                const podIdByGroup = findPodByGroup.map(id => id.id)
                // console.log("jumlah data pod dengan group id yang match", podIdByGroup.length);

                for (const podId of podIdByGroup) {
                    const insertData = {
                        link_class: data.data.link_class,
                        icon_class: data.data.icon_class,
                        icon_name: data.data.icon_name,
                        menu_name: data.data.menu_name,
                        information: data.data.information,
                        active: data.data.active,
                        mode_id: data.data.mode_id,
                        order_experience: data.data.order_experience, 
                        pod_id: podId
                    };

                    await prisma.experiences2.createMany({
                        data: insertData
                    });
                }

                const findnewExperiencesData = await prisma.experiences2.findMany({
                    where: {
                        pod_id: {
                            in: podIdByGroup
                        }, 
                        link_class: data.data.link_class
                    }
                })

                const message = {
                    pod_id: data.data.pod_id,
                    findnewExperiencesData, 
                }

                await bounceCreateExperiences(findnewExperiencesData)

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31m❌ Error processing message:', error.message, '\x1b[0m');
                channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error('\x1b[31m❌ Error initializing consumer:', error, '\x1b[0m');
    }
};

const consumeUpdateExperiencesGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateExperienceDataGroup, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, updateExperienceDataGroup, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());
                const groupIds = data.group_ids;

                // Ambil semua pod yang terkait dengan group_id yang dikirim
                const pods = await prisma.pod.findMany({
                    where: {
                        fk_group_id: { in: groupIds }
                    }
                });

                const podIds = pods.map(pod => pod.id);
                console.log("pod_ids: ", podIds);

                // Cari data experience di pod yang cocok dengan menu_name dan order_experience
                const targetExperiences = await prisma.experiences2.findMany({
                    where: {
                        pod_id: { in: podIds },
                        //menu_name: data.data.menu_name, //kuncinya ada pada menu name, tapi bagaimana jika menu name diupdate..? 
                        order_experience: data.data.order_experience
                    }
                });

                console.log("target experience to update: ", targetExperiences.length);

                for (const exp of targetExperiences) {
                    const updateData = {
                        link_class: data.data.link_class,
                        icon_class: data.data.icon_class,
                        icon_name: data.data.icon_name,
                        menu_name: data.data.menu_name,
                        information: data.data.information,
                        active: data.data.active,
                        mode_id: data.data.mode_id,
                        order_experience: data.data.order_experience,
                        update_date: new Date()
                    };

                    const updated = await prisma.experiences2.updateMany({
                        where: {
                            pod_id: { in: podIds },
                            order_experience: updateData.order_experience
                        },
                        data: updateData
                    });

                    // console.log("✅ Updated experience:", updated);
                }

                const findUpdatedExperience = await prisma.experiences2.findMany({
                    where: {
                        pod_id: { in: podIds },
                        menu_name: data.data.menu_name,
                        order_experience: data.data.order_experience
                    }
                });

                console.log("🟢 Final updated experiences:", findUpdatedExperience.length);

                // Kirim kembali data yang sudah diupdate ke admin/pod lain jika dibutuhkan
                await bounceUpdateExperiences(findUpdatedExperience);

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31m❌ Error processing message:', error.message, '\x1b[0m');
                channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error('\x1b[31m❌ Error initializing consumer:', error, '\x1b[0m');
    }
};

const consumeDeleteExperiencesGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteExperienceDataGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteExperienceDataGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync delete experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                console.log("ini adalah data yang didapat dari admin: ", data);

                const group_ids = data.group_ids
                const order_experience = data.data.order_experience
                console.log("ini adalah order experiemnce: ", order_experience);

                const findPodByGroup = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {
                            in: group_ids
                        }
                    }
                })

                const podIdByGroup = findPodByGroup.map(id => id.id)
                console.log("jumlah data pod dengan group id yang match", podIdByGroup);

                const getMatchExpData = await prisma.experiences2.findMany({
                    where: {
                        pod_id: {
                            in: podIdByGroup
                        }, 
                        order_experience: order_experience
                    }
                })
                const expId = getMatchExpData.map(id => id.id) 
                console.log("ini adalah match experience_id: ", expId);

                    const deleteDetailExp2 = await prisma.detail_experience.deleteMany({
                    where: {
                        experience_id: {
                            in: expId
                        }
                    }
                })

                const DeleteManyExp = await prisma.experiences2.deleteMany({
                    where: {
                        id: {
                            in: expId
                        }
                    }
                });
                console.log("experience deleted", DeleteManyExp);
                console.log("detail experience deleted", deleteDetailExp2);

                const message = {
                    data: expId, 
                    order_experience: order_experience
                }

                await bounceDeleteExperiences(message)

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31m❌ Error processing message:', error.message, '\x1b[0m');
                channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error('\x1b[31m❌ Error initializing consumer:', error, '\x1b[0m');
    }
};

export {
    consumeCreateExperiencesGroup, 
    consumeUpdateExperiencesGroup, 
    consumeDeleteExperiencesGroup
}
