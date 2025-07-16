import amqp from 'amqplib';
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import {
    sendDisclaimerToPods, 
    updateDisclaimerToPods
} from './publish.to..queue';

dotenv.config();
const prisma = new PrismaClient();

const disclaimerSpreadExchange = `${process.env.ANSWER_EXCHANGE}`;
const updateDisclaimerSpreadExchange = `${process.env.UPDATE_ANSWER_EXCHANGE}`;
const connectionUrl = process.env.RABBITMQ_URL;

const syncDisclaimerData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(disclaimerSpreadExchange, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, disclaimerSpreadExchange, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync disclaimer data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("Received disclaimer data Message:", JSON.stringify(data, null, 2));

                    const { accepted, questions } = data;

                    await sendDisclaimerToPods(data)

                    await prisma.terms_and_conditions_accepted.upsert({
                        where: { id: accepted.id },
                        update: {
                            accepted: accepted.accepted,
                            accepted_date: new Date(accepted.accepted_date),
                            update_date: new Date(accepted.update_date),
                            deleted_at: accepted.deleted_at ? new Date(accepted.deleted_at) : null
                        },
                        create: {
                            id: accepted.id,
                            fk_user_id: accepted.fk_user_id,
                            accepted: accepted.accepted,
                            accepted_date: new Date(accepted.accepted_date),
                            created_date: new Date(accepted.created_date),
                            update_date: new Date(accepted.update_date),
                            deleted_at: accepted.deleted_at ? new Date(accepted.deleted_at) : null
                        }
                    });

                    for (const question of questions) {
                        const existingQuestion = await prisma.terms_and_conditions_questions.findUnique({
                            where: { id: question.fk_question_id }
                        });

                        if (!existingQuestion) {
                            console.warn(`Warning: Question ID ${question.fk_question_id} not found. Skipping.`);
                            continue;
                        }

                        await prisma.terms_and_conditions_answers.upsert({
                            where: { id: question.id },
                            update: {
                                answer: question.answer,
                                answer_date: new Date(question.answer_date),
                                deleted_at: question.deleted_at ? new Date(question.deleted_at) : null
                            },
                            create: {
                                id: question.id,
                                fk_user_id: question.fk_user_id,
                                fk_question_id: question.fk_question_id,
                                answer: question.answer,
                                answer_date: new Date(question.answer_date),
                                deleted_at: question.deleted_at ? new Date(question.deleted_at) : null
                            }
                        });
                    }

                    console.log("\x1b[32mSuccessfully saved disclaimer data\x1b[0m");
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

const syncUpdateDisclaimerData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(updateDisclaimerSpreadExchange, 'fanout', { durable: true });
        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, updateDisclaimerSpreadExchange, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync update disclaimer data): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    await updateDisclaimerToPods(data)

                    const updatedResults = [];

                    for (const { fk_question_id, answer } of data.answers) {
                        const updateResult = await prisma.terms_and_conditions_answers.updateMany({
                            where: {
                                fk_user_id: data.user_id,
                                fk_question_id: fk_question_id,
                                terms_and_conditions_questions: {
                                    active: true,
                                    deleted_at: null,
                                },
                            },
                            data: { answer }
                        });

                        updatedResults.push({
                            fk_question_id,
                            answer,
                            userId: data.user_id, 
                            updatedCount: updateResult.count
                        });
                    }

                    console.log("\x1b[32mAll updates completed:\x1b[0m");
                    // console.table(updatedResults);

                    console.log("\x1b[32mSuccessfully update disclaimer data\x1b[0m");
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
    syncDisclaimerData, 
    syncUpdateDisclaimerData 
};