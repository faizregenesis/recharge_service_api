import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;

const synchPodTopicData  = `${process.env.SYNCH_POD_TOPIC_DATA}`;
const synchSocketTopicData  = `${process.env.SYNCH_SOCKET_TOPIC_DATA}`;

const quePodTopicData = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(synchPodTopicData, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(synchPodTopicData, '', Buffer.from(messageString));
        console.log(`Create pod topic data synch: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const queSocketTopicData = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(synchSocketTopicData, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(synchSocketTopicData, '', Buffer.from(messageString));
        console.log(`Create socket topic data synch: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    quePodTopicData, 
    queSocketTopicData
};
