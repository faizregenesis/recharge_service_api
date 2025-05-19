import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;

const bounceExperiencesCreate  = `${process.env.BOUNCE_EXPERIENCES_CREATE}`;
const bounceExperiencesUpdate  = `${process.env.BOUNCE_EXPERIENCES_UPDATE}`;
const bounceExperiencesDelete  = `${process.env.BOUNCE_EXPERIENCES_DELETE}`;

const bounceCreateExperiences = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceExperiencesCreate, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceExperiencesCreate, '', Buffer.from(messageString));
        console.log(`Create experiences spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const bounceUpdateExperiences = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceExperiencesUpdate, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceExperiencesUpdate, '', Buffer.from(messageString));
        console.log(`Update experiences spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

const bounceDeleteExperiences = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceExperiencesDelete, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceExperiencesDelete, '', Buffer.from(messageString));
        console.log(`Delete experiences spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

export {
    bounceCreateExperiences, 
    bounceUpdateExperiences, 
    bounceDeleteExperiences
};
