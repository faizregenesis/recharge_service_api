import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios"; 
import { v4 as uuidv4 } from 'uuid';
dotenv.config(); 
import { 
    bounceNodeDataToAdmin 
} from "./publish.to..queue";

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
                const group_ids = data.group_ids

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

const consumeNodeDataGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createNodeByGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createNodeByGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add node data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("ini adalah data add node yang didapat dari admin: ", data);

                const group_ids = data.group_ids
                const node = data.node
                const connections = data.connections
                const node_buttons = data.node_buttons
                const nodes_output = data.nodes_output

                const matchPodByGroup = await prisma.pod.findMany({
                    where: {
                        fk_group_id: {
                            in: group_ids
                        }
                    }
                });

                const matchPodIds = matchPodByGroup.map(pod => pod.id);
                console.log("match pos id:", matchPodIds);

                // insert node data
                const insertedNodes = [];
                for (const podId of matchPodIds) {
                    const uniqueNodeCode = `${node.code}_${podId}`;
                    const nodeResult = await prisma.node.upsert({
                        where: {
                            code: uniqueNodeCode,
                            label: node.label,
                        },  
                        create: {
                            code: uniqueNodeCode,
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
                        }, 
                        update: {
                            code: uniqueNodeCode,
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

                    insertedNodes.push(nodeResult);
                }
                const nodeId = insertedNodes.map(id => id.id)

                const connectionDataList = [];
                for (const nodeIdItem of nodeId) {
                    const formatData = connections.map((data: any) => ({
                        id: uuidv4(),
                        from: data.from,
                        to: data.to,
                        code: `${data.code}_${nodeIdItem}`,
                        fk_node_id: nodeIdItem,
                        updated_date: data.updated_date,
                        created_date: data.created_date,
                        deleted_at: data.deleted_at
                    }));

                    const createData = await prisma.connections.createMany({
                        data: formatData, 
                        skipDuplicates: true
                    });
                    connectionDataList.push(...formatData);
                    console.log("connection created: ", createData);
                }

                const nodeButtonList = [];
                for (const nodeIdItem of nodeId) {
                    const formatData = node_buttons.map((data: any) => ({
                        id: uuidv4(),
                        button_code: `${data.button_code}_${nodeIdItem}`,
                        name: data.name,
                        output_number: data.output_number,
                        fk_node_id: nodeIdItem,
                        updated_date: data.updated_date,
                        created_date: data.created_date,
                    }));

                    const createData = await prisma.node_button.createMany({
                        data: formatData, 
                        skipDuplicates: true
                    });
                    nodeButtonList.push(...formatData);
                    console.log("node button created: ", createData);
                }

                const nodeOutputList = [];
                for (const nodeIdItem of nodeId) {
                    const formatData = nodes_output.map((data: any) => ({
                        id: uuidv4(),
                        nodes_code: `${data.nodes_code}_${nodeIdItem}`,
                        side: data.side,
                        class: data.class,
                        fk_node_id: nodeIdItem,
                        output_code: data.output_code,
                        updated_date: data.updated_date,
                        created_date: data.created_date, 
                        deleted_at: data.deleted_at
                    }));

                    const createData = await prisma.nodes_output.createMany({
                        data: formatData, 
                        skipDuplicates: true
                    });
                    nodeOutputList.push(...formatData);
                    console.log("node output created: ", createData);
                }

                const message = {
                    group_ids: group_ids, 
                    upsertNodeData: insertedNodes, 
                    newConnections: connectionDataList,
                    newNodeButtons: nodeButtonList,
                    newNodesOutput: nodeOutputList,
                }

                await bounceNodeDataToAdmin(message)

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
                console.log("node ids: ", nodeIds);

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

        console.log(`\x1b[32mService is waiting for messages on queue (sync delete node data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("delete node by group", data);
                const nodeIds = data.nodeIds
                console.log("node ids: ", nodeIds);

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

export {
    consumeNodeData, 
    consumeNodeDataGroup,
    consumeDeleteNodeData,  
    consumeDeleteNodeDataGroup
}
