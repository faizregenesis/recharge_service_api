import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

const upsertSelfDevData  = process.env.UPSERT_SELF_DEVELOPMENT_EXCHANGE;
const deleteSelfDevDataExchange  = process.env.DELETE_SELF_DEVELOPMENT_EXCHANGE;
const connectionUrl = process.env.RABBITMQ_URL;

const consumeInsertSelfDevData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${upsertSelfDevData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${upsertSelfDevData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync uppsert self dev data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    console.log("ini adalah data yang didapat dari admin: ", data.is_explore);

                    const existPodId = await prisma.pod.findMany({
                        where: {
                            id: data.fk_pod_id
                        }
                    })

                    console.log("ini adalah pod yang tersedia: ", existPodId.length);

                    if (existPodId.length === 1) {
                        console.log(`\x1b[32m✅ pod id match\x1b[0m`);

                        const existSelfDev = await prisma.self_development2.findFirst({
                            where: {
                                id: data.id,
                                fk_pod_id: data.fk_pod_id
                            }
                        });

                        if (existSelfDev) {
                            const updateSelfDev = await prisma.self_development2.update({
                                where: {
                                    id: data.id
                                },
                                data: {
                                    self_development_name: data.self_development_name, 
                                    description: data.description, 
                                    icon: data.icon,
                                    fk_pod_id: data.fk_pod_id, 
                                    is_explore: data.is_explore,
                                    created_date: data.created_date, 
                                    updated_date: data.updated_date, 
                                    order: data.order, 
                                    deleted_at: data.deleted_at
                                }
                            })
                            console.log("\x1b[32m✅ self dev data successfully updated into database\x1b[0m", updateSelfDev.id);

                            console.log("\x1b[32m✅ update new self development to metadata...\x1b[0m");

                        } else {
                            const createSelfDev = await prisma.self_development2.create({
                                data: {
                                    id: data.id, 
                                    self_development_name: data.self_development_name, 
                                    description: data.description, 
                                    icon: data.icon,
                                    fk_pod_id: data.fk_pod_id, 
                                    is_explore: data.is_explore,
                                    created_date: data.created_date, 
                                    updated_date: data.updated_date, 
                                    order: data.order, 
                                    deleted_at: data.deleted_at
                                }
                            })
                            console.log("\x1b[32m✅ self dev data successfully inserted into database\x1b[0m", createSelfDev.id);
                        }

                    } else {
                        console.log("self development data is not for this pod, skip create self dev data");
                    }

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

const deleteSelfDevData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteSelfDevDataExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteSelfDevDataExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete self dev data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    // const data = JSON.parse(messageContent);
                    console.log("ini adalah data yang diterima: ", messageContent);

                    const existSelfDev = await prisma.self_development2.findUnique({
                        where: {
                            id: messageContent.toString()
                        }
                    })

                    if (existSelfDev) {
                        const deleteSelfDev = await prisma.self_development2.delete({
                            where: {
                                id: messageContent.toString()
                            }
                        })
                        console.log("\x1b[32m✅ self dev data successfully deleted: \x1b[0m", deleteSelfDev.id);
                    } else {
                        console.log("delete self dev is not for this pod, skip deleting data");
                    }

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
    consumeInsertSelfDevData,
    deleteSelfDevData, 
}
