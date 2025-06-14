import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const bounceReplaceExperienceData  = `${process.env.BOUNCE_REPLACE_EXPERIENCE_DATA}`;

const bounceExperienceData = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceReplaceExperienceData, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceReplaceExperienceData, '', Buffer.from(messageString));
        console.log(`Bounce experienceData send to admin: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    bounceExperienceData
};
