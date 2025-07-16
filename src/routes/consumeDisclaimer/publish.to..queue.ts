import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const exchangeName = `${process.env.SPREAD_DISCLAIMER_EXCHANGE}`;
const updatExchangeName = `${process.env.UPDATE_SPREAD_DISCLAIMER_EXCHANGE}`;

const sendDisclaimerToPods = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(exchangeName, '', Buffer.from(messageString));
        console.log(`Create disclaimer Data sent to pods and admin: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to spread disclaimer data:', error);
    }
};

const updateDisclaimerToPods = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updatExchangeName, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(updatExchangeName, '', Buffer.from(messageString));
        console.log(`Create disclaimer Data sent to pods and admin: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to spread disclaimer data:', error);
    }
};

export {
    sendDisclaimerToPods, 
    updateDisclaimerToPods
};
