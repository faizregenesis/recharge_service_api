import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from "dotenv";
dotenv.config();
import {
    spreadUserData
} from './spread.user';


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
                // console.log(`\x1b[34mReceived message:\x1b[0m ${msg.content.toString()}`);
                try {
                    const data = JSON.parse(msg.content.toString());
                    await prisma.user.upsert({
                        where: { email: data.email },
                        update: {
                            full_names: data.full_names,
                            username: data.username,
                            is_test_user: data.is_test_user,
                            updated_at: new Date(),
                        },
                        create: {
                            user_id: data.user_id,
                            full_names: data.full_names,
                            username: data.username,
                            email: data.email,
                            password: data.password,
                            is_test_user: data.is_test_user ?? false,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
        
                    console.log('\x1b[32mUser data successfully synchronized!\x1b[0m');
                    await spreadUserData(data)
                    channel.ack(msg);
                } catch (error) {
                    console.error('\x1b[31mError processing user data:', error, '\x1b[0m');
                    channel.nack(msg, false, false);
                }
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
