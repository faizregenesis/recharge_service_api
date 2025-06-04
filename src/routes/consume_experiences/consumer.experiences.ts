import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from 'dotenv';
import { loginToAdmin } from "../../login.to.admin";

dotenv.config();

const connectionUrl = `${process.env.RABBITMQ_URL}`;
const createExperienceData  = `${process.env.CREATE_EXPERIENCE_DATA}`;
const updateExperienceData  = `${process.env.UPDATE_EXPERIENCE_DATA}`;
const deleteExperienceData  = `${process.env.DELETE_EXPERIENCE_DATA}`;

const consumeCreateExperiencesData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(createExperienceData, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, createExperienceData, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (synch create experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log("ini adalah data yang didapat dari admin:", data);

                    const podLocal = await prisma.pod.findMany({})
                    const podLocalId = podLocal.map(id => id.id)

                    console.log("pod local id: ", podLocalId);
                    console.log("pod yang dari admin: ", data.pod_id);

                    if (podLocalId.includes(data.pod_id)) {
                        const createExperience = await prisma.experiences2.upsert({
                            where: {
                                id: data.id
                            }, 
                            update: {
                                pod_id: data.pod_id,
                                menu_name: data.menu_name, 
                                icon_name: data.icon_name, 
                                link_class: data.link_class, 
                                icon_class: data.icon_class, 
                                information: data.information, 
                                active: data.active, 
                                mode_id: data.mode_id,
                            }, 
                            create: {
                                id: data.id, 
                                pod_id: data.pod_id,
                                menu_name: data.menu_name, 
                                icon_name: data.icon_name, 
                                link_class: data.link_class, 
                                icon_class: data.icon_class, 
                                information: data.information, 
                                active: data.active, 
                                mode_id: data.mode_id,
                            }
                        })

                        console.log("experience data created: ", createExperience.id);
                    } else {
                        console.log("create experience data is not for this pod");
                    }

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

const consumeUpdateExperiencesData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateExperienceData, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, updateExperienceData, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (synch update experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());

                    const podLocal = await prisma.pod.findMany({})
                    const podLocalId = podLocal.map(id => id.id)

                    // console.log("pod local id: ", podLocalId);
                    // console.log("pod yang dari admin: ", data.pod_id);

                    if (podLocalId.includes(data.pod_id)) {
                        const updateExperience = await prisma.experiences2.upsert({
                            where: {
                                id: data.id
                            }, 
                            update: {
                                pod_id: data.pod_id,
                                menu_name: data.menu_name, 
                                icon_name: data.icon_name, 
                                link_class: data.link_class, 
                                icon_class: data.icon_class, 
                                information: data.information, 
                                active: data.active, 
                                mode_id: data.mode_id,
                            }, 
                            create: {
                                id: data.id, 
                                pod_id: data.pod_id,
                                menu_name: data.menu_name, 
                                icon_name: data.icon_name, 
                                link_class: data.link_class, 
                                icon_class: data.icon_class, 
                                information: data.information, 
                                active: data.active, 
                                mode_id: data.mode_id,
                            }
                        })

                        console.log("exprience data updated: ", updateExperience.id);
                    } else {
                        console.log("update experience data is not for this pod");
                    }

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

const consumeDeleteExperiencesData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(deleteExperienceData, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, deleteExperienceData, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (synch delete experiences data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());

                    const podLocal = await prisma.pod.findMany({})
                    const podLocalId = podLocal.map(id => id.id)

                    // console.log("pod local id: ", podLocalId);
                    // console.log("pod yang dari admin: ", data.pod_id);

                    if (podLocalId.includes(data.pod_id)) {
                        const deleteDetailExperience = await prisma.detail_experience2.deleteMany({
                            where: {
                                experience_id: data.id
                            }
                        })

                        const deleteExperience = await prisma.experiences2.delete({
                            where: {
                                id: data.id, 
                                pod_id: data.pod_id
                            }
                        })

                        console.log("detail exprience data deleted: ", deleteDetailExperience);
                        console.log("exprience data deleted: ", deleteExperience.id);
                    } else {
                        console.log("delete experience data is not for this pod");
                    }

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
    consumeCreateExperiencesData,
    consumeUpdateExperiencesData, 
    consumeDeleteExperiencesData
};
