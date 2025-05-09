import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import {
    bounceCreateSelfDevToAdmin
} from './publish.to..queue';


dotenv.config(); 

const upsertSelfDevSoundDataExchange  = process.env.UPSERT_SELF_DEVELOPMENT_SOUND_EXCHANGE;
const createSelfDevSoundGroupExchangeName  = `${process.env.CREATE_SELF_DEV_BY_GROUP_EXCHANGE}`;
const updateSelfDevSoundGroupExchangeName  = `${process.env.UPDATE_SELF_DEV_BY_GROUP_EXCHANGE}`;

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
                        deleted_at: data.deleted_at
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
                        created_date: now,
                        updated_date: now
                        }
                    });
                });

                const insertedRecords = await Promise.all(insertPromises);
                const formattingBounceMessage = insertedRecords.map(sound => ({
                    id: sound.id, 
                    self_development_id: sound.self_development_id, 
                    sound_code: sound.sound_code, 
                    title: sound.title, 
                    duration: sound.duration, 
                    description: sound.description, 
                    sound_path: sound.sound_path, 
                    file_path: sound.file_path
                }))
                // console.log("Inserted records:", formattingBounceMessage);
                
                const message = {
                    data: formattingBounceMessage, 
                    group_ids: data.group_ids, 
                    podIds: podIds, 
                    data0: formattingBounceMessage[0], 
                }

                await bounceCreateSelfDevToAdmin(message)

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
    consumeCreateSelfDevgGroup, 
    consumeInsertSelfDevSoundData
}
