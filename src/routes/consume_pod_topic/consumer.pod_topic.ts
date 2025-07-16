import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';

dotenv.config(); 

const synchPodTopicData  = `${process.env.SYNCH_POD_TOPIC_DATA}`;
const synchSocketTopicData  = `${process.env.SYNCH_SOCKET_TOPIC_DATA}`;

const connectionUrl = "amqp://guest:guest@192.168.199.10:5672";

const consumeCreatePodTopic = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${synchPodTopicData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${synchPodTopicData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync pod topic data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const podTopic = JSON.parse(messageContent);

                // console.log("ini adalah data yang didapat: ", podTopic);

                const created = await prisma.pod_topics.create({
                    data: {
                        id: podTopic.id,
                        module_name: podTopic.module_name,
                        event_description: podTopic.event_description,
                        topic: podTopic.topic,
                        action: podTopic.action,
                        retain: podTopic.retain,
                        publish_example_value: podTopic.publish_example_value,
                        subscribe_example_value: podTopic.subscribe_example_value,
                        value_range: podTopic.value_range,
                        remarks: podTopic.remarks,
                        keyword: podTopic.keyword,
                        created_date: new Date(podTopic.created_date),
                        update_date: new Date(podTopic.update_date),
                        deleted_at: podTopic.deleted_at ? new Date(podTopic.deleted_at) : null
                    }
                });

                console.log("Pod topic inserted into DB:", created.id);
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


const consumeCreateSocketTopic = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${synchSocketTopicData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${synchSocketTopicData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync socket topic data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = msg.content.toString();
                const data = JSON.parse(messageContent);

                // console.log("socket ", data);

                const createSocketTopic = await prisma.socket_topics.create({
                    data: data
                })

                console.log("socket topic created: ", createSocketTopic);

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
    consumeCreatePodTopic,
    consumeCreateSocketTopic 
}
