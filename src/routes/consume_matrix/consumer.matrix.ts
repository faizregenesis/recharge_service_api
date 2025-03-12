import amqp from 'amqplib';
import { PrismaClient } from "@prisma/client";
import dotenv from  "dotenv"
const prisma = new PrismaClient();
dotenv.config(); 

const updateQuestionMatrixExchange = `${process.env.UPDATE_MATRIX_EXCHANGE}`;
const connectionUrl = process.env.RABBITMQ_URL;

const consumeUpdateQuestionMatrix = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateQuestionMatrixExchange, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, updateQuestionMatrixExchange, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (sync upsert matrix): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    const termQuestions = data.map((item: any) => ({
                        id: item.question.id,
                        question: item.question.question,
                        information: item.question.information,
                        active: item.question.active,
                        created_date: new Date(item.question.created_date),
                        update_date: new Date(item.question.update_date)
                    }));

                    const transactions = [];

                    for (const q of termQuestions) {
                        const existingQuestion = await prisma.terms_and_conditions_questions.findUnique({
                            where: { id: q.id }
                        });

                        if (existingQuestion) {
                            transactions.push(
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
                            );
                            console.log("question updated");
                        } else {
                            transactions.push(
                                prisma.terms_and_conditions_questions.create({
                                    data: {
                                        id: q.id,
                                        question: q.question,
                                        information: q.information,
                                        active: q.active,
                                        created_date: q.created_date,
                                        update_date: q.update_date
                                    }
                                })
                            );

                            console.log("question created");
                        }
                    }
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
}
