import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const bounceCreateSelfDev  = `${process.env.BOUNCE_SELF_DEV_SOUND_CREATE}`;
const bounceUpdateSelfDev  = `${process.env.BOUNCE_SELF_DEV_SOUND_UPDATE}`;
const bounceDeleteSelfDev  = `${process.env.BOUNCE_SELF_DEV_SOUND_UPDATE}`;

const bounceCreateSelfDevToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceCreateSelfDev, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceCreateSelfDev, '', Buffer.from(messageString));
        console.log(`Create self dev spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const bounceUpdateSelfDevToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceUpdateSelfDev, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceUpdateSelfDev, '', Buffer.from(messageString));
        console.log(`Update self dev spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    bounceCreateSelfDevToAdmin, 
    bounceUpdateSelfDevToAdmin
};
