import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from  "dotenv";
dotenv.config();
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios"; 

const podUrl = process.env.POD_URL;
const spreadGroupData = `${process.env.SPREAD_GROUP_DATA}`;
const connectionUrl = process.env.RABBITMQ_URL;

const fetchInitialGroupeData = async () => {
    try {
        const token = await loginToAdmin();

        if (!token) {
            throw new Error("Login failed, token is undefined.");
        }

        const response = await axios.get(`${podUrl}/group/for/pod`, {
            headers: {
                "Authorization": `${token}`,
            }
        });

        const result = await response.data;
        const initialData = result.data;

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("GROUP DATA EMPTY AT DATABASE", initialData);
        }

        console.log("group data from admin url", initialData);

        for (const groupData of initialData) {
            const dataGroup = await prisma.group.upsert({
                where: { id: groupData.id },
                update: {
                    group_name: groupData.group_name
                },
                create: {
                    id: groupData.id,
                    group_name: groupData.group_name
                },
            });
            // console.log(`\x1b[32mgroup data successfully sync: ${dataGroup.id}\x1b[0m`);
        }

    } catch (error: any) {
        console.error('Failed to synchronize data:', error.message);
    }
};

const consumeGroupData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(spreadGroupData, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, spreadGroupData, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync Group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);

                    const insertGroup = await prisma.group.create({
                        data: data
                    })

                    console.log("✅ Group data successfully created!", insertGroup.id);

                    channel.ack(msg);
                } catch (error) {
                    console.error('\x1b[31mError processing message:', error, '\x1b[0m');
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error: any) {
        console.error('\x1b[31mError initializing consumer:', error.message, '\x1b[0m');
    }
};

export {
    fetchInitialGroupeData, 
    consumeGroupData
}
