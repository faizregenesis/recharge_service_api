import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';
dotenv.config(); 

const consumeBioFeedbackData = process.env.UPSERT_DETAIL_TRAINING_MODE_GROUP;
const connectionUrl = process.env.RABBITMQ_URL;

const consumeUpsertBioFeedbackByGroup = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${consumeBioFeedbackData}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${consumeBioFeedbackData}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (insert bio feedback data by group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    const group_ids = data.data.group_ids;

                    const getPodData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })

                    console.log(getPodData.map(id => id.id));

                    // console.log("Group IDs:", group_ids);
                    // console.log("Training mode", data);

                    // const detailTrainingList = data.data.detail_training_mode;
                    // console.log("Detail Training Mode:");
                    // detailTrainingList.forEach((item: any, index: number) => {
                    //     console.log(`--- Training #${index + 1} ---`);
                    //     console.log("ID:", item.id);
                    //     console.log("Stroboscopic Light:", item.stroboscopic_light);
                    //     console.log("Audio Surround Sound:", item.audio_surround_sound);
                    //     console.log("Vibro Acoustics:", item.vibro_acoustics);
                    //     console.log("Duration:", item.duration);
                    //     console.log("Song:", item.song);
                    //     console.log("Video:", item.video);
                    //     console.log("Sound Scape:", item.sound_scape);
                    //     console.log("UV-A:", item.uva);
                    //     console.log("UV-B:", item.uvb);
                    //     console.log("UV-C:", item.uvc);
                    //     console.log("PEMF Value:", item.pemf_value);
                    //     console.log("Scent:", item.scent);
                    //     console.log("Burst Times:", item.burst_time_bio_feedback);
                    //     console.log("Frequencies:", item.generator_frequency_bio_feedback);
                    // });

                    channel.ack(msg)
                } catch (error) {
                    console.error('\x1b[31mError processing message:', error, '\x1b[0m');
                    channel.nack(msg, false, true);
                }
            }
        });

    } catch (error) {
        console.error('\x1b[31mError initializing consumer:', error, '\x1b[0m');
    }
};

export {
    consumeUpsertBioFeedbackByGroup
}
