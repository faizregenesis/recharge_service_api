import amqp from 'amqplib';
import dotenv from 'dotenv';
import prisma from '../../../prisma/prisma';

dotenv.config();

const connectionUrl = `${process.env.RABBITMQ_URL}`;
const replaceSelfDevDataGroup  = `${process.env.REPLACE_SELF_DEV_BY_GROUP_EXCHANGE}`;

const consumeReplaceSelfDevData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(replaceSelfDevDataGroup, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, replaceSelfDevDataGroup, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (synch replace self dev data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    const selfDevIdMatch = data.selfDevIdMatch

                    const deleteSelfDevSound = await prisma.self_development_sound2.deleteMany({
                        where: {
                            self_development_id: {in: selfDevIdMatch}
                        }
                    })

                    const deleteteSelfDevData = await prisma.self_development2.deleteMany({
                        where: {
                            id: {in: selfDevIdMatch}
                        }
                    })

                    console.log({
                            message: "delete self dev data before save",  
                            deleteteSelfDevData:deleteteSelfDevData,  
                            deleteSelfDevSound: deleteSelfDevSound
                        }
                    );

                    const selfDevData = data.data

                    for (const entry of selfDevData) {
                        for (const devEntry of entry.self_developments) {
                            const dev = devEntry.self_development;
                            const sounds = devEntry.sounds;

                            const createSelfDevData = await prisma.self_development2.create({
                                data: {
                                    id: dev.id,
                                    self_development_name: dev.self_development_name,
                                    description: dev.description,
                                    icon: dev.icon,
                                    fk_pod_id: dev.fk_pod_id,
                                    is_explore: dev.is_explore,
                                    order: dev.order,
                                    created_date: new Date(dev.created_date),
                                    updated_date: new Date(dev.updated_date),
                                    deleted_at: dev.deleted_at ? new Date(dev.deleted_at) : null,

                                    sounds: {
                                        create: sounds.map((sound: any) => ({
                                            id: sound.id,
                                            sound_code: sound.sound_code,
                                            duration: sound.duration,
                                            description: sound.description,
                                            sound_path: sound.sound_path,
                                            file_path: sound.file_path,
                                            title: sound.title,
                                            caption: sound.caption,
                                            self_dev_order: sound.self_dev_order,
                                            order: sound.order,
                                            video: sound.video,
                                            created_date: new Date(sound.created_date),
                                            updated_date: new Date(sound.updated_date),
                                            deleted_at: sound.deleted_at ? new Date(sound.deleted_at) : null,
                                        })),
                                    },
                                },
                            });

                            console.log("self dev data created: ", createSelfDevData.id);
                        }
                    }

                    channel.ack(msg);
                } catch (error: any) {
                    console.error('Error processing message:', error.message);
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error) {
        console.error('Error initializing consumer:', error);
    }
};

export {
    consumeReplaceSelfDevData
};
