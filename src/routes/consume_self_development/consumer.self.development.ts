import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

const upsertSelfDevData  = process.env.UPSERT_SELF_DEVELOPMENT_EXCHANGE;
const deleteSelfDevDataExchange  = process.env.DELETE_SELF_DEVELOPMENT_EXCHANGE;
const replaceSelfDevSoundGroupExchangeName  = `${process.env.REPLACE_SELF_DEV_BY_GROUP_EXCHANGE}`;
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

const consumeReplaceSelfDevData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${replaceSelfDevSoundGroupExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${replaceSelfDevSoundGroupExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (replace self dev data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                const group_id = data.groupId;
                const selfDevData = data.data;

                const getPodData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: { in: group_id }
                    }
                });

                if (getPodData.length === 0) {
                    console.warn("⚠️ No pod found for group_id:", group_id);
                    channel.ack(msg);
                    return;
                }

                const podId = getPodData[0].id;
                console.log("Found pod_id:", podId);
                console.log("Group ID:", group_id);

                const selfDevMatch = await prisma.self_development2.findMany({
                    where: {
                        fk_pod_id: podId.toString()
                    }
                })
                const selfDevIdDelete = selfDevMatch.map(id => id.id)

                const deleteSound = await prisma.self_development_sound2.deleteMany({
                    where: {
                        self_development_id: {in: selfDevIdDelete}
                    }
                })

                const deleteSelfDev = await prisma.self_development2.deleteMany({
                    where: {
                        fk_pod_id: podId
                    }
                })

                console.log({
                    message: "delete self dev and sound before save", 
                    deleteSound: deleteSound, 
                    deleteSelfDev: deleteSelfDev
                });

                for (const item of selfDevData) {
                    const developments = item.self_developments;
                    if (Array.isArray(developments)) {
                        console.log("Self Development Entries:");

                        for (const dev of developments) {
                            const selfDevs = dev.self_development;
                            const sounds = dev.sounds;
                            // console.log({ selfDevs, sounds });
                            const selfDevsArray = Array.isArray(selfDevs) ? selfDevs : [selfDevs];
                            const selfDevDataPush: any[] = [];

                            for (const selfDev of selfDevsArray) {
                                const createdSelfDev = await prisma.self_development2.create({
                                    data: {
                                        id: selfDev.id,
                                        self_development_name: selfDev.self_development_name,
                                        description: selfDev.description,
                                        icon: selfDev.icon,
                                        fk_pod_id: podId.toString(),
                                        is_explore: selfDev.is_explore,
                                    },
                                });

                                selfDevDataPush.push(createdSelfDev);
                                console.log("self dev created:", createdSelfDev.id);
                            }

                            const selfDevIds = selfDevDataPush.map((sd) => sd.id);
                            console.log("self dev ids:", selfDevIds);

                            if (Array.isArray(sounds)) {
                                for (const sound of sounds) {
                                    const relatedSelfDevId = selfDevIds[0];

                                    const createdSound = await prisma.self_development_sound2.create({
                                        data: {
                                            id: sound.id,
                                            self_development_id: relatedSelfDevId,
                                            sound_code: sound.sound_code,
                                            duration: sound.duration,
                                            description: sound.description,
                                            sound_path: sound.sound_path,
                                            file_path: sound.file_path,
                                            title: sound.title,
                                            caption: sound.caption,
                                            order: sound.order,
                                            video: sound.video,
                                        },
                                    });

                                    console.log("sound created:", createdSound.id);
                                }
                            }
                        }
                    }
                }

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
    consumeInsertSelfDevData,
    deleteSelfDevData, 
    consumeReplaceSelfDevData
}
