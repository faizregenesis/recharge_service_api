import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios"; 
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
dotenv.config(); 
import { 
    bounceNodeDataToAdmin, 
    bounceDeleteNodeDataToAdmin
} from "./publish.to..queue";
import { 
    insertConnections,
    insertNodeButtons,
    insertNodesOutput
} from "./nodeDataService";

const generateRandomString = (length = 6) => {
    return randomBytes(length).toString('hex').slice(0, length);
};

const createNodeData  = `${process.env.CREATE_NODE_DATA}`;
const createNodeByGroup  = `${process.env.CREATE_NODE_BY_GROUP}`;
const connectionUrl       = `${process.env.RABBITMQ_URL}`;
const deleteNodeByGroup  = `${process.env.DELETE_NODE_BY_GROUP}`;
const deleteNodeData  = `${process.env.DELETE_NODE_DATA}`;

const consumeNodeData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createNodeData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createNodeData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add node data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data add node yang didapat dari admin: ", data);

                const node = data.node
                const nodes_output = data.nodes_output
                const connections = data.connections
                const node_buttons = data.node_buttons

                const nodeOutputFormat = nodes_output.map((output: any) => ({
                    id: output.id,
                    nodes_code: output.nodes_code,
                    side: output.side,
                    class: output.class,
                    fk_node_id: output.fk_node_id,
                    output_code: output.output_code,
                    updated_date: output.updated_date,
                    created_date: output.created_date,
                    deleted_at: output.deleted_at
                }))

                const connectionFormat = connections.map((conn: any) => ({
                    id: conn.id,
                    from: conn.from,
                    to: conn.to,
                    code: conn.code,
                    fk_node_id: conn.fk_node_id,
                    updated_date: conn.updated_date,
                    created_date: conn.created_date,
                    deleted_at: conn.deleted_at
                }))

                const nodeButtonFormat = node_buttons.map((butt: any) => ({
                    id: butt.id,
                    button_code: butt.button_code ,
                    name: butt.name,
                    output_number: butt.output_number,
                    fk_node_id: butt.fk_node_id,
                    updated_date: butt.updated_date,
                    created_date: butt.created_date,
                    deleted_at: butt.deleted_at 
                }))

                const upsertNodeData = await prisma.node.upsert({
                    where: {
                        id: data.node.id
                    }, 
                    create: node, 
                    update: node
                })

                let newNodesOutput: any[] = [];
                if (nodeOutputFormat && nodeOutputFormat.length > 0) {
                    newNodesOutput = await Promise.all(nodeOutputFormat.map(async (output: any) => {
                        return prisma.nodes_output.upsert({
                            where: { nodes_code: output.nodes_code },
                            update: {
                                nodes_code: output.nodes_code,
                                side: output.side,
                                class: output.class,
                                fk_node_id: output.fk_node_id,
                                output_code: output.output_code, 
                                updated_date: new Date()
                            },
                            create: {
                                nodes_code: output.nodes_code,
                                side: output.side,
                                class: output.class,
                                fk_node_id: output.fk_node_id,
                                output_code: output.output_code, 
                                created_date: new Date()
                            }
                        });
                    }));
                }

                let newConnections: any[] = [];
                if (connectionFormat && connectionFormat.length > 0) {
                    newConnections = await Promise.all(connectionFormat.map(async (conn: any) => {
                        return prisma.connections.upsert({
                            where: { code: conn.code },
                            update: {
                                from: conn.from,
                                to: conn.to,
                                fk_node_id: conn.fk_node_id,
                                updated_date: new Date()
                            },
                            create: {
                                from: conn.from,
                                to: conn.to,
                                code: conn.code,
                                fk_node_id: conn.fk_node_id,
                                created_date: new Date()
                            }
                        });
                    }));
                }

                let newNodeButtons: any[] = [];
                if (nodeButtonFormat && nodeButtonFormat.length > 0) {
                    newNodeButtons = await Promise.all(nodeButtonFormat.map(async (button: any) => {
                        const existingButton = await prisma.node_button.findFirst({
                            where: {
                                // id: button.id,
                                button_code: button.button_code, 
                                fk_node_id: button.fk_node_id
                            }
                        });

                        if (existingButton) {
                            return prisma.node_button.update({
                                where: { id: existingButton.id },
                                data: {
                                    button_code: button.button_code,
                                    name: button.name,
                                    output_number: button.output_number,
                                    fk_node_id: button.fk_node_id,
                                    updated_date: button.update_date,
                                    created_date: button.created_date,
                                    deleted_at: button.deleted_at
                                }
                            });
                        } else {
                            return prisma.node_button.create({
                                data: {
                                    id: button.id,
                                    button_code: button.button_code,
                                    name: button.name,
                                    output_number: button.output_number,
                                    fk_node_id: button.fk_node_id,
                                    updated_date: button.update_date,
                                    created_date: button.created_date,
                                    deleted_at: button.deleted_at
                                }
                            });
                        }
                    }));
                }

                const message = {
                    upsertNodeData: upsertNodeData, 
                    newNodesOutput: newNodesOutput,
                    newConnections: newConnections,
                    newNodeButtons: newNodeButtons,
                }

                console.log(message);
                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');

                try {
                    channel.nack(msg, false, true);
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeDeleteNodeData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteNodeData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteNodeData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync delete node data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                const nodeIds = data.nodeIds
                // console.log("node ids: ", nodeIds);

                await prisma.connections.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.node_button.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.nodes_output.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.node.deleteMany({
                    where: { 
                        id: { 
                            in: nodeIds 
                        } 
                    }
                });

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');

                try {
                    channel.nack(msg, false, true);
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeDeleteNodeDataGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteNodeByGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteNodeByGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete node data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);
                const group_ids = data.group_ids
                const matchingPodData = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {in: group_ids}
                    }
                })
                const matchPodId = matchingPodData.map(id => id.id)

                const nodeData = await prisma.node.findMany({
                    where: {
                        pod_id: {in: matchPodId}
                    }
                })
                const nodeIds = nodeData.map(id => id.id)
                const message = {
                    nodeIds: nodeIds
                }

                await bounceDeleteNodeDataToAdmin(message)

                await prisma.connections.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.node_button.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.nodes_output.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                await prisma.node.deleteMany({
                    where: { 
                        id: { 
                            in: nodeIds 
                        } 
                    }
                });
                console.log("node data deleted by group", nodeIds.length);

                channel.ack(msg);
            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');

                try {
                    channel.nack(msg, false, true);
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

const consumeNodeDataGroup = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(createNodeByGroup, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, createNodeByGroup, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add node data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const { group_ids, node, connections, node_buttons, nodes_output } = JSON.parse(msg.content.toString());

                const matchedPods = await prisma.pod.findMany({
                    where: { fk_group_id: { in: group_ids } }
                });

                const podIds = matchedPods.map(p => p.id);
                const insertedNodes: any[] = [];

                for (const podId of podIds) {
                    const createdNode = await prisma.node.create({
                        data: {
                            code: generateRandomString(),
                            label: node.label,
                            type: node.type,
                            position_x: node.position_x,
                            position_y: node.position_y,
                            inputs: node.inputs,
                            pod_id: podId,
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

                const newConnections = await insertConnections(nodeIds, connections);
                const newNodeButtons = await insertNodeButtons(nodeIds, node_buttons);
                const newNodesOutput = await insertNodesOutput(nodeIds, nodes_output);

                console.log("ini adalah data koneksi: ", newConnections);

                const resultMessage = {
                    group_ids,
                    upsertNodeData: insertedNodes,
                    newConnections,
                    newNodeButtons,
                    newNodesOutput
                };

                try {
                    await bounceNodeDataToAdmin(resultMessage);
                } catch (err: any) {
                    console.warn("⚠️ Failed to bounce data to admin, but ack will continue:", err.message);
                }

                channel.ack(msg);

            } catch (error: any) {
                console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');
                try {
                    channel.nack(msg, false, true);
                } catch (nackErr) {
                    console.error("❌ Failed to nack message:", nackErr);
                }
            }
        });

    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

export {
    consumeNodeData, 
    consumeNodeDataGroup,
    consumeDeleteNodeData,  
    consumeDeleteNodeDataGroup
}
