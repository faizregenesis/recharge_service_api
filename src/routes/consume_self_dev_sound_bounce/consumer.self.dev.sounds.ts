import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import {
    bounceCreateSelfDevSoundToAdmin, 
    bounceUpdateSelfDevSoundToAdmin, 
    bounceDeleteSelfDevSoundToAdmin
} from './publish.to..queue';

dotenv.config(); 

const upsertSelfDevSoundDataExchange  = process.env.UPSERT_SELF_DEVELOPMENT_SOUND_EXCHANGE;
const deleteSelfDevSoundDataExchange  = process.env.DELETE_SELF_DEVELOPMENT_SOUND_EXCHANGE;

const createSelfDevSoundGroupExchangeName  = `${process.env.CREATE_SELF_DEV_BY_GROUP_EXCHANGE}`;
const updateSelfDevSoundGroupExchangeName  = `${process.env.UPDATE_SELF_DEV_BY_GROUP_EXCHANGE}`;
const deleteSelfDevSoundGroupExchangeName  = `${process.env.DELETE_SELF_DEV_BY_GROUP_EXCHANGE}`;

const connectionUrl = process.env.RABBITMQ_URL;

const consumeInsertSelfDevSoundData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${upsertSelfDevSoundDataExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${upsertSelfDevSoundDataExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update self dev data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                const upsertSelfDev = await prisma.self_development_sound2.upsert({
                    where: { id: data.id },
                    update: {
                        self_development_id: data.self_development_id,
                        sound_code: data.sound_code,
                        duration: data.duration,
                        description: data.description,
                        sound_path: data.sound_path,
                        file_path: data.file_path,
                        title: data.title,
                        caption: data.caption, 
                        created_date: data.created_date, 
                        updated_date: data.updated_date, 
                        deleted_at: data.deleted_at, 
                    }, 
                    create: {
                        self_development_id: data.self_development_id,
                        sound_code: data.sound_code,
                        duration: data.duration,
                        description: data.description,
                        sound_path: data.sound_path,
                        file_path: data.file_path,
                        title: data.title,
                        caption: data.caption, 
                        created_date: data.created_date, 
                        updated_date: data.updated_date, 
                        deleted_at: data.deleted_at
                    }
                });

                console.log("success to upsert self dev: ", upsertSelfDev);

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

const consumeCreateSelfDevgGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createSelfDevSoundGroupExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createSelfDevSoundGroupExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync create self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                console.log("ini adalah data yang didapat dari admin: ", data);

                // 1. dapatkan semua data pod yang sesuai dengan group terlebih dahulu
                const podData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {
                            in: data.group_ids
                        }
                    }
                })
                const podIds = podData.map(id => id.id)
                console.log("ini adalah data pod id yang sesuai dengan group: ", podIds);

                // 2. dapatkan semua data self dev yang sesuai dengan pod
                const selfDevData = await prisma.self_development2.findMany({
                    where: {
                        fk_pod_id: {
                            in: podIds
                        }
                        // self_development_name: data.self_development_name
                    }
                })
                const selfDevId = selfDevData.map(idSelfDev => idSelfDev.id)
                console.log("ini adalah id self dev yang sesuai dengan group: ", selfDevId);

                // 3. simpan data ke dalam database:
                const now = new Date();
                const insertPromises = selfDevId.map(id => {
                    return prisma.self_development_sound2.create({
                        data: {
                            self_development_id: id,
                            sound_code: data.soundData.sound_code, 
                            title: data.soundData.title, 
                            duration: data.soundData.duration, 
                            description: data.soundData.description, 
                            sound_path: data.soundData.sound_path, 
                            file_path: data.soundData.file_path, 
                            caption: data.soundData.caption,
                            order: data.soundData.order,
                            created_date: now,
                            updated_date: now
                        }
                    });
                });

                const insertedRecords = await Promise.all(insertPromises);
                console.log("insertedRecords", insertedRecords);

                const formattingBounceMessage = insertedRecords.map(sound => ({
                    id: sound.id, 
                    self_development_id: sound.self_development_id, 
                    sound_code: sound.sound_code, 
                    title: sound.title, 
                    duration: sound.duration, 
                    description: sound.description, 
                    sound_path: sound.sound_path, 
                    file_path: sound.file_path, 
                    order: sound.order
                }))
                console.log("Inserted records:", formattingBounceMessage);
                
                const message = {
                    data: formattingBounceMessage, 
                    group_ids: data.group_ids, 
                    podIds: podIds, 
                    data0: formattingBounceMessage[0], 
                    self_development_name: data.self_development_name
                } 

                await bounceCreateSelfDevSoundToAdmin(message)

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

const consumeUpdateSelfDevgGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${updateSelfDevSoundGroupExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updateSelfDevSoundGroupExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data yang didapat dari admin: ", data);

                // 1. dapatkan semua data pod yang sesuai dengan group terlebih dahulu
                const podData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {
                            in: data. group_ids
                        }
                    }
                })
                const podIds = podData.map(id => id.id)
                // console.log("ini adalah data pod id yang sesuai dengan group: ", podIds);

                // 2. dapatkan semua data self dev yang sesuai dengan pod
                const selfDevData = await prisma.self_development2.findMany({
                    where: {
                        fk_pod_id: {
                            in: podIds
                        }, 
                        self_development_name: data.self_development_name
                    }
                })
                const selfDevId = selfDevData.map(idSelfDev => idSelfDev.id)
                console.log("ini adalah id self dev yang sesuai dengan group: ", selfDevId);

                // 3. dapatkan semua data self dev sound yang akan diupdate
                const selfDevSoundData = await prisma.self_development_sound2.findMany({
                    where: {
                        self_development_id: {
                            in: selfDevId
                        }
                    }
                })
                const selfDevSoundId = selfDevSoundData.map(id => id.id)
                console.log("id self dev yang akan diupdate: ", selfDevSoundId);

                const updatedDaata = await prisma.self_development_sound2.updateMany({
                    where: {
                        id: { in: selfDevSoundId }, 
                        self_development_id: { in: selfDevId },
                    },
                    data: {
                        sound_code: data.soundData.sound_code,
                        title: data.soundData.title,
                        duration: data.soundData.duration,
                        description: data.soundData.description,
                        sound_path: data.soundData.sound_path,
                        file_path: data.soundData.file_path,
                        caption: data.soundData.caption,
                    },
                });

                console.log("updatedData", updatedDaata);

                const updatedRecords = await prisma.self_development_sound2.findMany({
                    where: {
                        self_development_id: { in: selfDevId },
                    },
                });

                const formattingBounceMessage = updatedRecords.map(sound => ({
                    id: sound.id,
                    self_development_id: sound.self_development_id,
                    sound_code: sound.sound_code,
                    title: sound.title,
                    duration: sound.duration,
                    description: sound.description,
                    sound_path: sound.sound_path,
                    file_path: sound.file_path,
                    caption: sound.caption
                }));

                const message = {
                    data: formattingBounceMessage, 
                    group_ids: data.group_ids, 
                    podIds: podIds, 
                    data0: formattingBounceMessage[0], 
                    self_development_name: data.self_development_name
                }
                // console.log("ini adalah message yang akan dikirim ke pod dan juga ke admin: ", message);

                await bounceUpdateSelfDevSoundToAdmin(message);

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

const deleteSelfDevSoundData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteSelfDevSoundDataExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteSelfDevSoundDataExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (delete self def sound data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                console.log("ini adalah message yang diterima delete self dev sound: ", messageContent);

                const existSelfDevSoundData = await prisma.self_development_sound2.findUnique({
                    where: {
                        id: `${messageContent}`
                    }
                })

                // console.log("ini adalah self dev yang tersedia: ", existSelfDevSoundData);

                if (existSelfDevSoundData) {
                    await prisma.self_development_sound2.delete({
                        where: {
                            id: `${messageContent}`
                        }
                    })
                    console.log("\x1b[32m✅ Self dev sound data deleted in database\x1b[0m");
                } else {
                    console.log("self dev sound data is not for this pod, skip deleting data");
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

const deleteSelfDevSoundDataGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteSelfDevSoundGroupExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteSelfDevSoundGroupExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (delete self def sound data bounce): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data yang didapat: ", data)

                const group_ids = data.group_ids 
                const selfDevSoundId = data.selfDevSoundId 

                const getSelfDevData = await prisma.self_development_sound2.findMany({
                    where: {
                        id: selfDevSoundId, 
                    }
                });
                const selfDevOrder = getSelfDevData.map(order => order.order)

                const getPodata = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {in: group_ids}
                    }
                })
                const podId = getPodata.map(id => id.id)
                // console.log("podId", podId);

                const getSelfDevDataMatch = await prisma.self_development2.findMany({
                    where: {
                        fk_pod_id: {in: podId}
                    }
                })
                const selfDevDataId = getSelfDevDataMatch.map(id => id.id).filter(id => id !== null);
                // console.log("selfDevDataId", selfDevDataId);

                const selfDevSoundToAdmin = await prisma.self_development_sound2.findMany({
                    where: {
                        self_development: { id: { in: selfDevDataId } },
                        order: Number(selfDevOrder)
                    }
                })
                const selfDevSoundIds = selfDevSoundToAdmin.map(id => id.id)
                console.log("self dev sound ids: ", selfDevSoundIds);
                const message = {
                    selfDevSoundIds: selfDevSoundIds
                }

                await bounceDeleteSelfDevSoundToAdmin(message)

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
    consumeCreateSelfDevgGroup, 
    consumeUpdateSelfDevgGroup, 
    deleteSelfDevSoundDataGroup, 
    consumeInsertSelfDevSoundData, 
    deleteSelfDevSoundData, 
}
