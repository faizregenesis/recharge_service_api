import amqp from 'amqplib';
import dotenv from  "dotenv"
import prisma from '../../../prisma/prisma';

import { 
    sendCreateGlobalSettingByGroup
} from './publish.to..queue';

dotenv.config(); 

const connectionUrl = process.env.RABBITMQ_URL;

const upsertGlobalSettingExchangeGroup = `${process.env.UPSERT_GLOBAL_SETTING_EXCHANGE_GROUP}`;
const upsertGlobalSettingExchange = `${process.env.UPSERT_GLOBAL_SETTING_EXCHANGE}`;

const consumeUpsertGlobalSettingBounce = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(`${upsertGlobalSettingExchangeGroup}`, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, `${upsertGlobalSettingExchangeGroup}`, '');
        channel.prefetch(1);

        console.log(`\x1b[32mService is waiting for messages on queue (sync upsert global setting group): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    const data = JSON.parse(messageContent);
                    // console.log("ini adalah data yang didapat dari admin: ", data);

                    const globalSettigData = data.data
                    const group_ids = data.group_ids
                    const pod_id = data.pod_id

                    const getMatchPodIdData = await prisma.pod.findMany({
                        where: {
                            fk_group_id: {in: group_ids}
                        }
                    })
                    const matchPodId = getMatchPodIdData.map(id => id.id)

                    for (const podId of matchPodId) {
                        const existingSetting = await prisma.global_setting2.findFirst({
                            where: {
                            pod_id: podId
                            }
                        });

                        const payload = {
                            ...globalSettigData,
                            pod_id: podId,
                            update_date: new Date()
                        };

                        delete payload.id;

                        if (existingSetting) {
                            await prisma.global_setting2.update({
                            where: {
                                id: existingSetting.id
                            },
                            data: payload
                            });
                            console.log(`Updated global_setting for pod_id ${podId}`);
                        } else {
                            await prisma.global_setting2.create({
                            data: payload
                            });
                            console.log(`Created global_setting for pod_id ${podId}`);
                        }
                    }

                    const getMatchGlobalSetting = await prisma.global_setting2.findMany({
                        where: {
                            pod_id: {in: matchPodId}
                        }
                    })
                    const matchGlobalSettingId = getMatchGlobalSetting.map(id => id.id)

                    const message = {
                        data: getMatchGlobalSetting, 
                        globalSettingId: matchGlobalSettingId
                    }

                    await sendCreateGlobalSettingByGroup(message)

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
    consumeUpsertGlobalSettingBounce, 
}
