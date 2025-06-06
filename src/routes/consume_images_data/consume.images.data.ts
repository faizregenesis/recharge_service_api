import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

const exchangeName  = process.env.IMAGE_EXCHANGE;
const connectionUrl = process.env.RABBITMQ_URL;

const consumeImageData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${exchangeName}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${exchangeName}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (sync image data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    console.log("Image data", data);

                    if (!data || typeof data !== 'object') {
                        console.error('\x1b[31mInvalid data format.\x1b[0m');
                        return channel.nack(msg, false, false);
                    }

                    await prisma.imageData.create({
                        data: {
                            id: data.id,
                            imageurl: data.imageurl, 
                            imageName: data.imageName
                        }
                    })

                    channel.ack(msg);

                } catch (error: any) {
                    console.error('\x1b[31mError processing message:', error.message, '\x1b[0m');
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

export {
    consumeImageData 
}
