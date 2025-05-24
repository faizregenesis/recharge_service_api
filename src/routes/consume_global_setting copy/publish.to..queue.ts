import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const createGlobalSettingByGroupBounce  = `${process.env.CREATE_GLOBAL_SETTING_BY_GROUP_BOUNCE}`;

const sendCreateGlobalSettingByGroup = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(createGlobalSettingByGroupBounce, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(createGlobalSettingByGroupBounce, '', Buffer.from(messageString));
        console.log(`Global Setting spread to pods and admin: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    sendCreateGlobalSettingByGroup, 
};
