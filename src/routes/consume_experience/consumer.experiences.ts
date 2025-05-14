import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import {
    bounceCreateExperiences, 
    bounceUpdateExperiences
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

                for (const podId of podIdByGroup) {
                    const insertData = {
                        link_class: data.data.link_class,
                        icon_class: data.data.icon_class,
                        icon_name: data.data.icon_name,
                        menu_name: data.data.menu_name,
                        information: data.data.information,
                        active: data.data.active,
                        mode_id: data.data.mode_id,
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

        await channel.assertExchange(`${updateExperienceDataGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updateExperienceDataGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                console.log("ini adalah daya yang didapat dari admin: ", data);

                // const group_ids = data.group_ids

                // const findPodByGroup = await prisma.pod.findMany({
                //     where: {
                //         fk_group_id: {
                //             in: group_ids
                //         }
                //     }
                // })

                // const podIdByGroup = findPodByGroup.map(id => id.id)
                // console.log("ini adalah pod id by group", podIdByGroup);

                // for (const podId of podIdByGroup) {
                //     const insertData = {
                //         link_class: data.data.link_class,
                //         icon_class: data.data.icon_class,
                //         icon_name: data.data.icon_name,
                //         menu_name: data.data.menu_name,
                //         information: data.data.information,
                //         active: data.data.active,
                //         mode_id: data.data.mode_id,
                //         pod_id: podId
                //     };

                //     await prisma.experiences2.createMany({
                //         data: insertData
                //     });
                // }

                // const findnewExperiencesData = await prisma.experiences2.findMany({
                //     where: {
                //         pod_id: {
                //             in: podIdByGroup
                //         }, 
                //         link_class: data.data.link_class
                //     }
                // })

                // await bounceUpdateExperiences(findnewExperiencesData)

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
    consumeUpdateExperiencesGroup
}
