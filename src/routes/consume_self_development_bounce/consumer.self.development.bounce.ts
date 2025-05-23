import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 
import {
    bounceCreateSelfDevToAdmin, 
    bounceUpdateSelfDevToAdmin, 
    bounceDeleteSelfDevToAdmin
} from './publish.to..queue';

const connectionUrl = process.env.RABBITMQ_URL;

const createSelfDevGroup  = `${process.env.CREATE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;
const updteSelfDevGroup  = `${process.env.UPDATE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;
const deleteSelfDevGroup  = `${process.env.DELETE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;

const consumeInsertSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    console.log("ini adalah data yang didapat dari admin: ", data);

                    const group_ids = data.group_ids;

                    // ambil semua pod yang punya fk_group_id sesuai group_ids
                    const getMatchPodData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: { in: group_ids }
                        }
                    });

                    const podIds = getMatchPodData.map(pod => pod.id);
                    console.log("ini adalah pod ids: ", podIds);

                    for (const podId of podIds) {
                        await prisma.self_development2.create({
                            data: {
                                self_development_name: data.selfDevData.self_development_name,
                                description: data.selfDevData.description,
                                icon: data.selfDevData.icon,
                                fk_pod_id: podId,
                                is_explore: data.selfDevData.is_explore,
                                order: data.selfDevData.order
                            }
                        });
                        console.log(`Inserted self development data into pod id: ${podId.length}`);
                    }

                    const getSelfDevToMessage = await prisma.self_development2.findMany({
                        where: {
                            fk_pod_id: {in: podIds}, 
                            order: data.selfDevData.order
                        }
                    })

                    const message = {
                        data: getSelfDevToMessage
                    }

                    await bounceCreateSelfDevToAdmin(message)

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

const consumeUpdateSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${updteSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updteSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("ini adalah data yang didapat dari admin: ", data);

                    const selfDevData = data.data
                    const group_ids = data.group_ids

                    const getMatchPodData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })
                    const podIds = getMatchPodData.map(id => id.id)

                    const getSelfDevData = await prisma.self_development2.findMany({
                        where: {
                            fk_pod_id: {in: podIds}, 
                            order: selfDevData.order
                        }
                    })
                    const idSelvDev =  getSelfDevData.map(id => id.id)
                    console.log("id self dev: ", idSelvDev);

                    const formatData = {
                        self_development_name: selfDevData.self_development_name,
                        description: selfDevData.description,
                        icon: selfDevData.icon,
                        is_explore: selfDevData.is_explore,
                        order: selfDevData.order,
                    }

                    console.log("podIds:",  podIds);
                    console.log("formatData", formatData);

                    const updateSelfDevData = await prisma.self_development2.updateMany({
                        where: {
                            id: {in: idSelvDev}
                        }, 
                        data: formatData
                    })

                    console.log("self dev updated: ", updateSelfDevData);

                    const message = {
                        data: formatData, 
                        idSelvDev: idSelvDev
                    }
                    await bounceUpdateSelfDevToAdmin(message)

                    channel.ack(msg)
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

const deleteSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    // console.log("ini adalah data yang diterima: ", data);

                    const selfDevId = data.selfDevId
                    const group_ids = data.group_ids

                    const getPodId = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })
                    const podId = getPodId.map(id => id.id)

                    const getOrder = await prisma.self_development2.findMany({
                        where: {
                            id: selfDevId, 
                        }
                    })
                    const orderSelfDev = getOrder.map(order => order.order).filter(order => order !== null);

                    const getSelfDev = await prisma.self_development2.findMany({
                        where: {
                            fk_pod_id: { in: podId }, 
                            order: {in: orderSelfDev}
                        },
                    })
                    const selfDevIds = getSelfDev.map(id => id.id)

                    const message = {
                        selfDevId: selfDevId, 
                        group_ids: group_ids, 
                        orderSelfDev: orderSelfDev, 
                        selfDevIds: selfDevIds
                    }

                    console.log(message);
                    await bounceDeleteSelfDevToAdmin(message)

                    const deleteSelfDev = await prisma.self_development2.deleteMany({
                        where: {
                            id: {in: selfDevIds}
                        }
                    })

                    console.log("selfDev deleted: ", deleteSelfDev);

                    channel.ack(msg)
                } catch (error) {
                    console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
                }

            }
        });

    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

export {
    consumeInsertSelfDevDataBounce,
    consumeUpdateSelfDevDataBounce,  
    deleteSelfDevDataBounce
}
