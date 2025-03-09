import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from "dotenv";
dotenv.config();
import { spreadUserData } from './spread.user';

const exchangeName = process.env.USER_EXCHANGE;
const userSpreadExchange = process.env.USER_SPREAD_EXCHANGE;
const connectionUrl = process.env.RABBITMQ_URL;

if (!exchangeName || !connectionUrl) {
    throw new Error('Environment variables USER_EXCHANGE or RABBITMQ_URL are missing');
}

const processMessage = async (channel: any, msg: any) => {
    if (!msg) return;

    // console.log(`\x1b[34mReceived message:\x1b[0m ${msg.content.toString()}`);
    const data = JSON.parse(msg.content.toString());

    try {
        let user = await prisma.user.findUnique({ where: { user_id: data.user_id } });

        if (user) {
            user = await prisma.user.update({
                where: { user_id: data.user_id },
                data: {
                    full_names: data.full_names,
                    username: data.username,
                    email: data.email,
                    is_test_user: data.is_test_user,
                    updated_at: new Date(),
                },
            });
            console.log('\x1b[32mUser data updated successfully!\x1b[0m');
        } else {
            user = await prisma.user.create({
                data: {
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
            console.log('\x1b[32mNew user created successfully!\x1b[0m');
        }

        const message = {
            user_id: data.user_id,
            full_names: data.full_names,
            username: data.username,
            email: data.email,
            password: data.password,
            is_test_user: data.is_test_user ?? false,
            created_at: new Date(),
            updated_at: new Date(),
        }

        console.log("data user yang disebar ke semua pod", message);

        await spreadUserData(message);
        console.log('\x1b[36mUser data successfully spread!\x1b[0m');

        channel.ack(msg);
        console.log('\x1b[32mMessage acknowledged successfully!\x1b[0m');

    } catch (error) {
        console.error('\x1b[31mError processing user data:', error, '\x1b[0m');
        
        if (error) {
            console.log('\x1b[33mSkipping message requeue due to spreadUserData error.\x1b[0m');
            channel.ack(msg);
        } else {
            channel.nack(msg, false, true);
        }
    }
};

const consumeUserData = async () => {
    try {
        const connection = await amqp.connect(connectionUrl);
        const channel = await connection.createChannel();
        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, exchangeName, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (user pod data): ${queue}\x1b[0m`);
        channel.consume(queue, (msg) => processMessage(channel, msg));

        process.on('SIGINT', async () => {
            console.log('\x1b[33mClosing RabbitMQ connection...\x1b[0m');
            await connection.close();
            process.exit(0);
        });
    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

const consumeUsersDataUpdate = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${userSpreadExchange}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${userSpreadExchange}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mAdmin is waiting for messages on queue (sync user data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    
                    const data = JSON.parse(messageContent);
                    console.log("Received user data Message:", data);

                    const existUserData = await prisma.user.findUnique({
                        where: { 
                            user_id: data.user_id 
                        }
                    });

                    if (existUserData) {
                        const updateUserData = await prisma.user.update({
                            where: { 
                                user_id: data.user_id
                            },
                            data: data
                        });
                        console.log("user data updated:", updateUserData.user_id);
                    } else if (existUserData === null) {
                        // const createUserData = await prisma.user.create({
                        //     data: data
                        // });
                        console.log("data not found", data.user_id);
                    }

                    channel.ack(msg);
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

export { 
    consumeUserData, 
    consumeUsersDataUpdate
};
