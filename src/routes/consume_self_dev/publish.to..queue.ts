import amqp from 'amqplib';
const dotenv = require('dotenv');
dotenv.config();

const connectionUrl = process.env.RABBITMQ_URL;
const bounceCreateSelfDevSound  = `${process.env.BOUNCE_SELF_DEV_SOUND_CREATE}`;
const bounceUpdateSelfDevSound  = `${process.env.BOUNCE_SELF_DEV_SOUND_UPDATE}`;

const bounceCreateSelfDevToAdmin = async (message: any) => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(bounceCreateSelfDevSound, 'fanout', { durable: true });

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        channel.publish(bounceCreateSelfDevSound, '', Buffer.from(messageString));
        console.log(`Self dev spread to pods and admin bounce: ${message}`);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Failed to send data:', error);
    }
};

// const sendUpdatePodSettingByGroup = async (message: any) => {
//     try {
//         const connection = await amqp.connect(`${connectionUrl}`);
//         const channel = await connection.createChannel();

//         await channel.assertExchange(updateByGroupExchangeName, 'fanout', { durable: true });

//         const messageString = typeof message === 'string' ? message : JSON.stringify(message);
//         channel.publish(updateByGroupExchangeName, '', Buffer.from(messageString));
//         console.log(`Update Pod Setting sent to pods: ${message}`);

//         await channel.close();
//         await connection.close();
//     } catch (error) {
//         console.error('Failed to send data:', error);
//     }
// };

export {
    bounceCreateSelfDevToAdmin, 
    // sendUpdatePodSettingByGroup
};
