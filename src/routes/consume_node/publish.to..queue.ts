import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const bounceNodeData  = `${process.env.BOUNCE_NODE_DATA}`;

const bounceNodeDataToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceNodeData, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceNodeData, '', Buffer.from(messageString));
        console.log(`Create mode data spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    bounceNodeDataToAdmin, 
};
