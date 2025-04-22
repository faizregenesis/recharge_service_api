import amqp from 'amqplib';
import { PrismaClient } from "@prisma/client";
import dotenv from  "dotenv"
const prisma = new PrismaClient();
dotenv.config(); 

const updateQuestionMatrixExchange = `${process.env.UPDATE_MATRIX_EXCHANGE}`;
const insertQuestionMatrixExchange = `${process.env.INSERT_MATRIX_EXCHANGE}`;
const connectionUrl = process.env.RABBITMQ_URL;

const consumeInsertQuestionMatrix = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(insertQuestionMatrixExchange, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, insertQuestionMatrixExchange, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync insert matrix): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("Received matrix insert:", data);

                    const termQuestions = {
                        id: data.id_question,
                        question: data.question,
                    };

                    const matrixData = data.matrix.map((item: any) => ({
                        id: item.id,
                        fk_question_id: item.fk_question_id,
                        stroboscopic_light: item.stroboscopic_light,
                        audio_surround_sound: item.audio_surround_sound,
                        vibro_acoustics: item.vibro_acoustics,
                        led_intensity: item.led_intensity,
                        led_color: item.led_color,
                        infra_red_nea_ir: item.infra_red_nea_ir,
                        infra_red_far_ir: item.infra_red_far_ir,
                        pemf_therapy: item.pemf_therapy,
                        olfactory_engagement: item.olfactory_engagement,
                        binaural_beats_isochronic_tones: item.binaural_beats_isochronic_tones,
                        direct_neutral_stimulation: item.direct_neutral_stimulation,
                        created_at: item.created_at,
                        updated_at: item.updated_at
                    }));

                    // console.log("Extracted create Questions:", termQuestions);
                    // console.log("Extracted create Matrices:", matrixData);

                    const createQuestion = await prisma.terms_and_conditions_questions.create({
                        data: {
                            id: termQuestions.id,
                            question: termQuestions.question,
                        }
                    });
                    console.log("question created: ", createQuestion.id);

                    await prisma.matrix_user.createMany({
                        data: matrixData,
                        skipDuplicates: true
                    });
                    // console.log("matrix created: ", createMatrix);

                    console.log("✅ Question & Matrix data successfully created!");

                    channel.ack(msg);
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

const consumeUpdateQuestionMatrix = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateQuestionMatrixExchange, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, updateQuestionMatrixExchange, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update matrix): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("Received update matrix Message:", data);

                    // **Memisahkan Question dan Matrix**
                    const termQuestions = data.map((item: any) => ({
                        id: item.question.id,
                        question: item.question.question,
                        information: item.question.information,
                        active: item.question.active,
                        created_date: item.question.created_date,
                        update_date: item.question.update_date
                    }));

                    const matrixData = data.map((item: any) => ({
                        id: item.matrix.id,
                        fk_question_id: item.matrix.fk_question_id,
                        stroboscopic_light: item.matrix.stroboscopic_light,
                        audio_surround_sound: item.matrix.audio_surround_sound,
                        vibro_acoustics: item.matrix.vibro_acoustics,
                        led_intensity: item.matrix.led_intensity,
                        led_color: item.matrix.led_color,
                        infra_red_nea_ir: item.matrix.infra_red_nea_ir,
                        infra_red_far_ir: item.matrix.infra_red_far_ir,
                        pemf_therapy: item.matrix.pemf_therapy,
                        olfactory_engagement: item.matrix.olfactory_engagement,
                        binaural_beats_isochronic_tones: item.matrix.binaural_beats_isochronic_tones,
                        direct_neutral_stimulation: item.matrix.direct_neutral_stimulation,
                        created_at: item.matrix.created_at,
                        updated_at: item.matrix.updated_at
                    }));

                    // console.log("Extracted Questions:", termQuestions);
                    // console.log("Extracted Matrices:", matrixData);

                    await prisma.$transaction([
                        ...termQuestions.map((q: any) =>
                            prisma.terms_and_conditions_questions.update({
                                where: { id: q.id },
                                data: {
                                    question: q.question,
                                    information: q.information,
                                    active: q.active,
                                    created_date: q.created_date,
                                    update_date: q.update_date
                                }
                            })
                        ),
                        ...matrixData.map((m: any) =>
                            prisma.matrix_user.update({
                                where: { id: m.id },
                                data: {
                                    fk_question_id: m.fk_question_id,
                                    stroboscopic_light: m.stroboscopic_light,
                                    audio_surround_sound: m.audio_surround_sound,
                                    vibro_acoustics: m.vibro_acoustics,
                                    led_intensity: m.led_intensity,
                                    led_color: m.led_color,
                                    infra_red_nea_ir: m.infra_red_nea_ir,
                                    infra_red_far_ir: m.infra_red_far_ir,
                                    pemf_therapy: m.pemf_therapy,
                                    olfactory_engagement: m.olfactory_engagement,
                                    binaural_beats_isochronic_tones: m.binaural_beats_isochronic_tones,
                                    direct_neutral_stimulation: m.direct_neutral_stimulation,
                                    created_at: m.created_at,
                                    updated_at: m.updated_at
                                }
                            })
                        )
                    ]);

                    console.log("✅ Question & Matrix data successfully updated!");

                    channel.ack(msg);
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
    consumeUpdateQuestionMatrix, 
    consumeInsertQuestionMatrix
}
