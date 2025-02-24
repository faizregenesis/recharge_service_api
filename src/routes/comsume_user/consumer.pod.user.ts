import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from "dotenv";
dotenv.config();

const exchangeName = process.env.USER_EXCHANGE;
const connectionUrl = process.env.RABBITMQ_URL;

if (!exchangeName || !connectionUrl) {
    throw new Error('Environment variables USER_EXCHANGE or RABBITMQ_URL are missing');
}

const consumeUserData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, exchangeName, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (user pod data): ${queue}\x1b[0m`);

        await channel.consume(queue, async (msg) => {
            if (msg !== null) {
                console.log(`\x1b[34mReceived message:\x1b[0m ${msg.content.toString()}`);
                channel.ack(msg);
            }
        });

        process.on('SIGINT', async () => {
            console.log('\x1b[33mClosing RabbitMQ connection...\x1b[0m');
            await connection.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

export { 
    consumeUserData 
};
