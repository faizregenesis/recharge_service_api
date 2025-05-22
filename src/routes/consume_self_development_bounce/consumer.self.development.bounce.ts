import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

const connectionUrl = process.env.RABBITMQ_URL;

const createSelfDevGroup  = `${process.env.CREATE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;
const updteSelfDevGroup  = `${process.env.UPDATE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;
const deleteSelfDevGroup  = `${process.env.DELETE_SELF_DEVELOPMENT_GROUP_EXCHANGE}`;

const consumeInsertSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${createSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${createSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync add self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("ini adalah data yang didapat dari admin: ", data);

                    const formatData = {
                        self_development_name: data.selfDevData.self_development_name,
                        description: data.selfDevData.description,
                        icon: data.selfDevData.icon,
                        fk_pod_id: data.selfDevData.fk_pod_id,
                        is_explore: data.selfDevData.is_explore,
                    }
                    const fk_pod_id = data.fk_pod_id
                    const group_ids = data.group_ids

                    const getMatchPodData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })
                    const podIds = getMatchPodData.map(id => id.id)
                    console.log("ini adalah pod ids: ", podIds);

                    const getMatchSelfDevData = await prisma.self_development2.findMany({
                        where: {
                            fk_pod_id: {in: fk_pod_id}
                        }
                    })

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

const consumeUpdateSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${updteSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${updteSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    console.log("ini adalah data yang didapat dari admin: ", data);

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

const deleteSelfDevDataBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${deleteSelfDevGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${deleteSelfDevGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (delete self dev data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    console.log("ini adalah data yang diterima: ", data);

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

export {
    consumeInsertSelfDevDataBounce,
    consumeUpdateSelfDevDataBounce,  
    deleteSelfDevDataBounce
}
