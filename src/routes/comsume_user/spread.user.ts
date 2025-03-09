import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const exchangeName  = `${process.env.USER_SPREAD_EXCHANGE}`;

const spreadUserData = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(exchangeName, '', Buffer.from(messageString));
        console.log(`User data sent to admin and pods: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send user data:', error);
    }
};

export {
    spreadUserData 
};
