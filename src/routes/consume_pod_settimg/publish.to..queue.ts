import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const createByGroupExchangeName  = `${process.env.CREATE_POD_SETTING_BY_GROUP_EXCHANGE}`;
const updateByGroupExchangeName  = `${process.env.UPDATE_POD_SETTING_BY_GROUP_EXCHANGE}`;

const sendCreatePodSettingByGroup = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(createByGroupExchangeName, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(createByGroupExchangeName, '', Buffer.from(messageString));
        console.log(`Pod Setting spread to pods and admin: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const sendUpdatePodSettingByGroup = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateByGroupExchangeName, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(updateByGroupExchangeName, '', Buffer.from(messageString));
        console.log(`Update Pod Setting sent to pods: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    sendCreatePodSettingByGroup, 
    sendUpdatePodSettingByGroup
};
