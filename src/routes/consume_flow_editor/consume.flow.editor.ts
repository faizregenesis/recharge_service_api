import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

import {
    bounceTaskDataToAdmin,
    bounceNodeDataToAdmin
} from "./publish.to..queue";

import { 
    insertConnections,
    insertNodeButtons,
    insertNodesOutput
} from "./nodeDataService";

const connectionUrl              = `${process.env.RABBITMQ_URL}`;
const createExchangeGroup        = `${process.env.CREATE_TASK2_EXCHANGE_GROUP}`;
const createNodeByGroup          = `${process.env.CREATE_NODE_BY_GROUP}`;

const consumeTaskAndNodeByGroup = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await initTaskConsumer(channel);
        await initNodeConsumer(channel);

    } catch (err: any) {
        console.error("❌ Error initializing consumers:", err.message);
    }
};

const initTaskConsumer = async (channel: amqp.Channel) => {
    await channel.assertExchange(createExchangeGroup, 'fanout', { durable: true });
    const { queue } = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue, createExchangeGroup, '');
    channel.prefetch(1);

    console.log(`\x1b[32mListening for TASK messages on: ${queue}\x1b[0m`);

    channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
            const { group_ids, data, igniters, last_state } = JSON.parse(msg.content.toString());

            const matchedPods = await prisma.pod.findMany({
                where: { fk_group_id: { in: group_ids } }
            });

            const createdTasks: any[] = [];
            for (const pod of matchedPods) {
                await prisma.$transaction(async (tx) => {
                    const task = await tx.task.create({
                        data: {
                            task_code: data.task_code,
                            pod_id: pod.id,
                            task_type_id: data.task_type_id,
                            created_date: data.created_date,
                            update_date: data.update_date,
                            deleted_at: data.deleted_at,
                            task_json: data.task_json,
                        }
                    });

                    const igniter = await tx.igniter.create({
                        data: { code: igniters[0], fk_task: task.id }
                    });

                    const lastState = await tx.last_state.create({
                        data: { code: last_state[0], fk_task: task.id }
                    });

                    createdTasks.push({
                        pod_id: pod.id,
                        task: task,
                        igniter: igniter,
                        last_state: lastState
                    });
                });
            }

            const message = {
                group_ids,
                data : createdTasks
            };

            await bounceTaskDataToAdmin(message)

            channel.ack(msg);
        } catch (err: any) {
            console.error("❌ Error processing TASK message:", err.message);
            channel.nack(msg, false, true);
        }
    });
};

const initNodeConsumer = async (channel: amqp.Channel) => {
    await channel.assertExchange(createNodeByGroup, 'fanout', { durable: true });
    const { queue } = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue, createNodeByGroup, '');
    channel.prefetch(1);

    console.log(`\x1b[32mListening for NODE messages on: ${queue}\x1b[0m`);

    channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
            const { group_ids, node, connections, node_buttons, nodes_output } = JSON.parse(msg.content.toString());

            const matchedPods = await prisma.pod.findMany({
                where: { fk_group_id: { in: group_ids } }
            });

            const insertedNodes: any[] = [];
            for (const pod of matchedPods) {
                const createdNode = await prisma.node.create({
                    data: {
                        code: node.code,
                        pod_id: pod.id,
                        label: node.label,
                        type: node.type,
                        position_x: node.position_x,
                        position_y: node.position_y,
                        inputs: node.inputs,
                        pob_state: node.pob_state,
                        template_style: node.template_style,
                        updated_date: node.updated_date,
                        created_date: node.created_date,
                        deleted_at: node.deleted_at
                    }
                });

                insertedNodes.push(createdNode);
            }

            const nodeIds = insertedNodes.map(n => n.id);
            const insertedConnections = await insertConnections(nodeIds, connections);
            const insertedNodeButtons = await insertNodeButtons(nodeIds, node_buttons);
            const insertedNodesOutput = await insertNodesOutput(nodeIds, nodes_output);

            // console.log("node Data by group", insertedNodes) ;

            const message = {
                data: insertedNodes, 
                connections: insertedConnections, 
                nodeButton: insertedNodeButtons, 
                nodeOutput: insertedNodesOutput
            }

            await bounceNodeDataToAdmin(message)

            channel.ack(msg);
        } catch (err: any) {
            console.error("❌ Error processing NODE message:", err.message);
            channel.nack(msg, false, true);
        }
    });
};

export {
    consumeTaskAndNodeByGroup
}
