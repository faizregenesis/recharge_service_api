import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 
import { 
    bounceDeleteNodeDataToAdmin
} from "./publish.to..queue";

const createNodeData  = `${process.env.CREATE_NODE_DATA}`;
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
                        return prisma.nodes_output.create({
                            data: {
                                id: output.id, 
                                nodes_code: output.nodes_code,
                                side: output.side,
                                class: output.class,
                                fk_node_id: output.fk_node_id,
                                output_code: output.output_code,
                                updated_date: new Date()
                            }
                        });
                    }));
                }

                let newConnections: any[] = [];
                if (connectionFormat && connectionFormat.length > 0) {
                    newConnections = await Promise.all(connectionFormat.map(async (conn: any) => {
                        return prisma.connections.create({
                            data: {
                                id: conn.id, 
                                from: conn.from,
                                to: conn.to,
                                fk_node_id: conn.fk_node_id,
                                updated_date: new Date()
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

                const deleteConn = await prisma.connections.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                const deleteNodeButton = await prisma.node_button.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                const deleteNodeOutput = await prisma.nodes_output.deleteMany({
                    where: { 
                        fk_node_id: { 
                            in: nodeIds 
                        } 
                    }
                });

                const deleteNode = await prisma.node.deleteMany({
                    where: { 
                        id: { 
                            in: nodeIds 
                        } 
                    }
                });

                const deleteNodeLog = {
                    deleteConn: deleteConn, 
                    deleteNodeButton: deleteNodeButton,
                    deleteNodeOutput: deleteNodeOutput, 
                    deleteNode: deleteNode
                }
                console.log("node data deleted by group", deleteNodeLog);

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
    consumeDeleteNodeData,  
    consumeDeleteNodeDataGroup
}
