import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const bounceCreateSelfDevSound  = `${process.env.BOUNCE_SELF_DEV_SOUND_CREATE}`;
const bounceUpdateSelfDevSound  = `${process.env.BOUNCE_SELF_DEV_SOUND_UPDATE}`;
const bounceDeleteSelfDevSound  = `${process.env.BOUNCE_SELF_DEV_SOUND_DELETE}`;

const bounceCreateSelfDevSoundToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceCreateSelfDevSound, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceCreateSelfDevSound, '', Buffer.from(messageString));
        console.log(`Create self dev spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const bounceUpdateSelfDevSoundToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceUpdateSelfDevSound, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceUpdateSelfDevSound, '', Buffer.from(messageString));
        console.log(`Update self dev sound spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const bounceDeleteSelfDevSoundToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceDeleteSelfDevSound, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceDeleteSelfDevSound, '', Buffer.from(messageString));
        console.log(`Delete self dev sounds spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    bounceCreateSelfDevSoundToAdmin, 
    bounceUpdateSelfDevSoundToAdmin, 
    bounceDeleteSelfDevSoundToAdmin
};
