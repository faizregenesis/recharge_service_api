import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios"; 
dotenv.config(); 

const createExchangeName  = process.env.CREATE_TASK2_EXCHANGE;
const createExchangeGroup  = process.env.CREATE_TASK2_EXCHANGE_GROUP;
const deleteExchangeName  = `${process.env.DELETE_TASK2_EXCHANGE}`;
const deleteExchangeNameByGroup  = `${process.env.DELETE_TASK2_EXCHANGE_BY_GROUP}`;
const connectionUrl       = `${process.env.RABBITMQ_URL}`;
const podUrl              = process.env.POD_URL;

const consumeDeleteTask2 = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(deleteExchangeName, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, deleteExchangeName, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete task2 data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            let alreadyHandled = false;

            try {
                const messageContent = msg.content.toString().trim();

                const existPodData = await prisma.pod.findUnique({
                    where: { id: messageContent }
                });

                if (existPodData) {
                    await prisma.igniter.deleteMany({
                        where: {
                            fk_task: {
                                in: (await prisma.task.findMany({
                                    where: { pod_id: messageContent },
                                    select: { id: true }
                                })).map(task => task.id),
                            }
                        }
                    });

                    await prisma.last_state.deleteMany({
                        where: {
                            fk_task: {
                                in: (await prisma.task.findMany({
                                    where: { pod_id: messageContent },
                                    select: { id: true }
                                })).map(task => task.id),
                            }
                        }
                    });

                    const deletedTask = await prisma.task.deleteMany({
                        where: { pod_id: messageContent },
                    });

                    console.log("task deleted successfully", deletedTask);
                } else {
                    console.log("delete task data is not for this pod");
                }

                channel.ack(msg);
                alreadyHandled = true;

            } catch (error) {
                console.error('\x1b[31m❌ Error processing message:', error, '\x1b[0m');
                if (!alreadyHandled) {
                    try {
                        channel.nack(msg, false, true);
                    } catch (e) {
                        console.error("Failed to nack message:", e);
                    }
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31m❌ Error initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeDeleteTask2ByGroup = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(deleteExchangeNameByGroup, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, deleteExchangeNameByGroup, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete task2 data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            let alreadyHandled = false;

            try {
                const messageContent = msg.content.toString().trim();
                const data = JSON.parse(messageContent);

                const group_ids = data.group_ids

                const matchPodData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {in: group_ids}
                    }
                })

                const matchPodId = matchPodData.map(id => id.id)

                const matchTaskData = await prisma.task.findMany({
                    where: {
                        pod_id: {
                            in: matchPodId
                        }
                    }
                })
                const matchTaskId = matchTaskData.map(id => id.id)

                await prisma.igniter.deleteMany({
                    where: {
                        fk_task: {in: matchTaskId}
                    }
                });

                await prisma.last_state.deleteMany({
                    where: {
                        fk_task: {
                            in: matchTaskId
                        }
                    }
                });

                await prisma.task.deleteMany({
                    where: { 
                        pod_id: {in: matchPodId} 
                    },
                });

                console.log("task data delete by group: ", matchTaskId.length);

                channel.ack(msg);
                alreadyHandled = true;

            } catch (error) {
                console.error('\x1b[31m❌ Error processing message:', error, '\x1b[0m');
                if (!alreadyHandled) {
                    try {
                        channel.nack(msg, false, true);
                    } catch (e) {
                        console.error("Failed to nack message:", e);
                    }
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31m❌ Error initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeTask2 = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createExchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createExchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add task2 data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data add task yang didapat dari admin: ", data);

                const existPodId = await prisma.pod.findUnique({
                    where: { id: data.pod_id }
                });

                if (existPodId) {
                    const insertTask2 = await prisma.task.create({
                        data: {
                            id: data.id,
                            task_type_id: data.task_type_id,
                            pod_id: data.pod_id,
                            task_code: data.task_code,
                            task_json: data.task_json,
                            template_style: data.template_style,
                            sound_task_id: data.sound_task_id,
                            informations: data.informations,
                            rgb_led: data.rgb_led, 

                            created_date: new Date(data.created_date),
                            update_date: new Date(data.update_date),
                            deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,

                            igniters: {
                                create: data.igniters.map((igniter: any) => ({
                                    id: igniter.id || "",
                                    code: igniter.code || "",
                                    created_date: igniter.created_date ? new Date(igniter.created_date) : null,
                                    updated_date: igniter.updated_date ? new Date(igniter.updated_date) : null,
                                    deleted_at: igniter.deleted_at ? new Date(igniter.deleted_at) : null
                                }))
                            },

                            last_state: {
                                create: data.last_state.map((state: any) => ({
                                    id: state.id || "",
                                    code: state.code || "",
                                    created_date: state.created_date ? new Date(state.created_date) : null,
                                    updated_date: state.updated_date ? new Date(state.updated_date) : null,
                                    deleted_at: state.deleted_at ? new Date(state.deleted_at) : null
                                }))
                            }
                        },
                        include: {
                            igniters: true,
                            last_state: true
                        }
                    });

                    console.log("task2 created", insertTask2.id);
                } else {
                    console.log("data is not for this pod");
                }

                channel.ack(msg);

            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');

                try {
                    channel.nack(msg, false, true); // Requeue jika terjadi error
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeTask2ByGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createExchangeGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createExchangeGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add task2 data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);
                console.log("data", data.igniters);

                // TODO 
                // continue consume task 2 
                const group_ids = data.group_ids
                const taskData = data.data 
                const igniters = data.igniters 
                const last_state = data.last_state

                console.log("igniters", igniters);
                console.log("last_state", last_state);

                const getMatchPodData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {in: group_ids}
                    }
                })
                const matchPodId = getMatchPodData.map(id => id.id)
                // console.log("pod id length: ", matchPodId.length);

                const insertedTask = [];
                for (const podId of matchPodId) {
                    try {
                        const taskResult = await prisma.task.create({
                            data: {
                                task_type_id: taskData.task_type_id,
                                pod_id: podId,
                                created_date: taskData.created_date,
                                update_date: taskData.update_date,
                                deleted_at: taskData.deleted_at,
                                task_code: taskData.task_code,
                                task_json: taskData.task_json,
                            }
                        });
                        insertedTask.push(taskResult);
                    } catch (error) {
                        console.error(`Gagal insert task untuk podId ${podId}:`, error);
                    }
                }
                const taskDataInsertId = insertedTask.map(id => id.id)
                console.log("taskDataInsertId: ", taskDataInsertId);

                let igniterDataInsert = []
                for (const taskId of taskDataInsertId) {
                    try {
                        const igniterResult = await prisma.igniter.create({
                            data: {
                                code: igniters[0],
                                fk_task: taskId,
                            }
                        });
                        igniterDataInsert.push(igniterResult);
                    } catch (error) {
                        console.error(`Gagal insert igniter untuk taskId ${taskId}:`, error);
                    }
                }
                // TODO
                // save flow editor data

                // let lastStateDataInsert = []
                // for (const taskId of taskDataInsertId) {
                //     try {
                //         const lastStateResult = await prisma.igniter.create({
                //             data: {
                //                 code: igniters[0],
                //                 fk_task: taskId,
                //             }
                //         });
                //         lastStateDataInsert.push(lastStateResult);
                //     } catch (error) {
                //         console.error(`Gagal insert igniter untuk taskId ${taskId}:`, error);
                //     }
                // }

                console.log("insert igniter data: ", igniterDataInsert);

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');

                try {
                    channel.nack(msg, false, true); // Requeue jika terjadi error
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

const fetchInitialTaskType = async () => {
    try {
        const token = await loginToAdmin();

        const response = await axios.get(`${podUrl}/task/type`, {
            headers: {
                "Authorization": `${token}`,
            }
        });

        const result = response.data;
        const initialData = result.data;

        // console.log("LENGTH POD TOPIC DATA: ", initialData.length);

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format version: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("ADMIN DATABASE EMPTY", initialData);
        }

        // console.log("ini adalah data yang didapat dari admin", initialData);

        for (const item of initialData) {
            await prisma.task_type.upsert({
                where: { id: item.id },
                update: {
                    code: item.code, 
                    name: item.name, 
                    small_screen: item.small_screen, 
                    big_screen: item.big_screen, 
                    number_of_input: item.number_of_input, 
                    number_of_output: item.number_of_output,
                    back: item.back, 
                    home: item.home, 
                    settings: item.settings, 

                    updated_date: item.updated_date, 
                    created_date: item.created_date, 
                    deleted_at: item.deleted_at
                },
                create: {
                    id: item.id,
                    code: item.code, 
                    name: item.name, 
                    small_screen: item.small_screen, 
                    big_screen: item.big_screen, 
                    number_of_input: item.number_of_input, 
                    number_of_output: item.number_of_output,
                    back: item.back, 
                    home: item.home, 
                    settings: item.settings,
                    updated_date: item.updated_date, 
                    created_date: item.created_date, 
                    deleted_at: item.deleted_at
                },
            });
        }

        console.log("tas type data successsfuly sync to database");
    } catch (error: any) {
        console.error('Failed to synchronize data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
};

const fetchInitialTask = async () => {
    try {
        const token = await loginToAdmin();

        const podData = await prisma.pod.findMany({});
        if (podData.length === 0) {
            throw new Error("No pod data found");
        }

        const response = await axios.get(`${podUrl}/task2/task/all`, {
            headers: {
                "Authorization": `${token}`,
            }
        });

        const result = response.data;
        const initialData = result.data;
        console.log("ini adalah data yang didapat", initialData);
        console.log("pod data", result);

        
        console.log("ini adalah data yang didapat dari admin", initialData.length);

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("ADMIN DATABASE EMPTY", initialData);
        }

        for (const item of initialData) {
            await prisma.task.upsert({
                where: { id: item.id },
                update: {
                    task_type_id: item.task_type_id, 
                    pod_id: item.pod_id, 
                    task_code: item.task_code, 
                    task_json: item.task_json, 
                    template_style: item.template_style,
                    sound_task_id: item.sound_task_id, 
                    informations: item.informations,

                    created_date: item.created_date, 
                    update_date: item.update_date, 
                    deleted_at: item.deleted_at, 
                },
                create: {
                    id: item.id,
                    task_type_id: item.task_type_id, 
                    pod_id: item.pod_id, 
                    task_code: item.task_code, 
                    task_json: item.task_json, 
                    template_style: item.template_style,
                    sound_task_id: item.sound_task_id, 
                    informations: item.informations,

                    created_date: item.created_date, 
                    update_date: item.update_date, 
                    deleted_at: item.deleted_at, 
                },
            });

            for (const igniter of item.igniters || []) {
                await prisma.igniter.upsert({
                    where: { id: igniter.id },
                    update: {
                        code: igniter.code,
                        fk_task: item.id,
                        updated_date: igniter.updated_date,
                        created_date: igniter.created_date,
                        deleted_at: igniter.deleted_at,
                    },
                    create: {
                        id: igniter.id,
                        code: igniter.code,
                        fk_task: item.id,
                        updated_date: igniter.updated_date,
                        created_date: igniter.created_date,
                        deleted_at: igniter.deleted_at,
                    },
                });
            }

            for (const state of item.last_state || []) {
                await prisma.last_state.upsert({
                    where: { id: state.id },
                    update: {
                        code: state.code,
                        fk_task: item.id,
                        updated_date: state.updated_date,
                        created_date: state.created_date,
                        deleted_at: state.deleted_at,
                    },
                    create: {
                        id: state.id,
                        code: state.code,
                        fk_task: item.id,
                        updated_date: state.updated_date,
                        created_date: state.created_date,
                        deleted_at: state.deleted_at,
                    },
            });
            }
        }

        console.log("Task data successfully synced to database");
    } catch (error: any) {
        console.error('Failed to synchronize data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
};

export {
    consumeDeleteTask2, 
    consumeTask2,
    fetchInitialTaskType, 
    fetchInitialTask, 
    consumeDeleteTask2ByGroup, 
    consumeTask2ByGroup
}
