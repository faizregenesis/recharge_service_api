import amqp from 'amqplib';
import prisma from '../../../prisma/prisma';
import dotenv from  "dotenv"; 
dotenv.config(); 
import { loginToAdmin } from "../../login.to.admin";
import axios from "axios"; 

const exchangeName = `${process.env.VERSION_EXCHANGE}`;
const connectionUrl = process.env.RABBITMQ_URL;
const podUrl = process.env.POD_URL;

const consumeVersionData = async () => {
    try {
        const connection = await amqp.connect(`${connectionUrl}`);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(queue, exchangeName, '');
        channel.prefetch(1);

        console.log(`\x1b[32mPod is waiting for messages on queue (sync version): ${queue}\x1b[0m`);

        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const messageContent = msg.content.toString();
                    // console.log("Received Message:", messageContent);

                    const data = JSON.parse(messageContent);

                    // console.log("INI ADALAH DATA YANG DITERIMA: ", data);

                    if (!data || typeof data !== 'object') {
                        console.error('\x1b[31mInvalid data format.\x1b[0m');
                        return channel.nack(msg, false, false);
                    }

                    // console.log('\x1b[32mData version from pod:\x1b[0m', JSON.stringify(data, null, 2));

                    const versionBigScreen = await prisma.version_big_screen.upsert({
                        where: { id: data.version_big_screen.id },
                        update: {
                            file: data.version_big_screen.file,
                            date_realese: data.version_big_screen.date_realese ? new Date(data.version_big_screen.date_realese) : null,
                            signature: data.version_big_screen.signature,
                            big_screen_version: data.version_big_screen.big_screen_version,
                            created_date: new Date(data.version_big_screen.created_date),
                            update_date: new Date(data.version_big_screen.update_date),
                        },
                        create: {
                            id: data.version_big_screen.id,
                            file: data.version_big_screen.file,
                            date_realese: data.version_big_screen.date_realese ? new Date(data.version_big_screen.date_realese) : null,
                            signature: data.version_big_screen.signature,
                            big_screen_version: data.version_big_screen.big_screen_version,
                            created_date: new Date(data.version_big_screen.created_date),
                            update_date: new Date(data.version_big_screen.update_date),
                        },
                    });

                    const versionSmallScreen = await prisma.version_small_screen.upsert({
                        where: { id: data.version_small_screen.id },
                        update: {
                            file: data.version_small_screen.file,
                            signature: data.version_small_screen.signature,
                            small_screen_version: data.version_small_screen.small_screen_version,
                            created_date: new Date(data.version_small_screen.created_date),
                            update_date: new Date(data.version_small_screen.update_date),
                        },
                        create: {
                            id: data.version_small_screen.id,
                            file: data.version_small_screen.file,
                            signature: data.version_small_screen.signature,
                            small_screen_version: data.version_small_screen.small_screen_version,
                            created_date: new Date(data.version_small_screen.created_date),
                            update_date: new Date(data.version_small_screen.update_date),
                        },
                    });

                    const versionMobileApi = await prisma.version_mobile_api.upsert({
                        where: { id: data.version_mobile_api.id },
                        update: {
                            file: data.version_mobile_api.file,
                            signature: data.version_mobile_api.signature,
                            mobile_api_version: data.version_mobile_api.mobile_api_version,
                            created_date: new Date(data.version_mobile_api.created_date),
                            update_date: new Date(data.version_mobile_api.update_date),
                        },
                        create: {
                            id: data.version_mobile_api.id,
                            file: data.version_mobile_api.file,
                            signature: data.version_mobile_api.signature,
                            mobile_api_version: data.version_mobile_api.mobile_api_version,
                            created_date: new Date(data.version_mobile_api.created_date),
                            update_date: new Date(data.version_mobile_api.update_date),
                        },
                    });

                    const appVersion = await prisma.app_version.create({
                        data: {
                            id: data.id,
                            description: data.description,
                            notes: data.notes,
                            version: data.version,
                            pub_date: data.pub_date ? new Date(data.pub_date) : null,
                            app_version_status: data.app_version_status,
                            version_big_screen: {
                                connect: { id: versionBigScreen.id },
                            },
                            version_small_screen: {
                                connect: { id: versionSmallScreen.id },
                            },
                            version_mobile_api: {
                                connect: { id: versionMobileApi.id },
                            },
                            created_date: new Date(data.created_date),
                            update_date: new Date(data.update_date),
                        },
                    });

                    console.log('Data app_version successfully saved:', appVersion.id);

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

const fetchInitialVersionData = async () => {
    try {
        const token = await loginToAdmin();

        if (!token) {
            throw new Error("Login failed, token is undefined.");
        }

        const response = await axios.get(`${podUrl}/version-management/for/pods`, {
            headers: {
                "Authorization": `${token}`,
            }
        });

        const result = await response.data;
        const initialData = result.data;

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format version: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("ADMIN DATABASE EMPTY", initialData);
        }

        // console.log("INI ADALAH SEMUA DATA DARI ADMIN", initialData);

        for (const appVersion of initialData) {
            const { version_big_screen, version_small_screen, version_mobile_api } = appVersion;

            const versionBigScreen = await prisma.version_big_screen.upsert({
                where: { id: version_big_screen.id },
                update: {
                    file: version_big_screen.file,
                    date_realese: version_big_screen.date_realese ? new Date(version_big_screen.date_realese) : null,
                    signature: version_big_screen.signature,
                    big_screen_version: version_big_screen.big_screen_version,
                    created_date: new Date(version_big_screen.created_date),
                    update_date: new Date(version_big_screen.update_date),
                },
                create: {
                    id: version_big_screen.id,
                    file: version_big_screen.file,
                    date_realese: version_big_screen.date_realese ? new Date(version_big_screen.date_realese) : null,
                    signature: version_big_screen.signature,
                    big_screen_version: version_big_screen.big_screen_version,
                    created_date: new Date(version_big_screen.created_date),
                    update_date: new Date(version_big_screen.update_date),
                },
            });
            // console.log(`\x1b[32mbig screen data successfully saved: ${versionBigScreen.id}\x1b[0m`);

            const versionSmallScreen = await prisma.version_small_screen.upsert({
                where: { id: version_small_screen.id },
                update: {
                    file: version_small_screen.file,
                    signature: version_small_screen.signature,
                    small_screen_version: version_small_screen.small_screen_version,
                    created_date: new Date(version_small_screen.created_date),
                    update_date: new Date(version_small_screen.update_date),
                },
                create: {
                    id: version_small_screen.id,
                    file: version_small_screen.file,
                    signature: version_small_screen.signature,
                    small_screen_version: version_small_screen.small_screen_version,
                    created_date: new Date(version_small_screen.created_date),
                    update_date: new Date(version_small_screen.update_date),
                },
            });
            // console.log(`\x1b[32msmall screen data successfully saved: ${versionSmallScreen.id}\x1b[0m`);

            const versionMobileApi = await prisma.version_mobile_api.upsert({
                where: { id: version_mobile_api.id },
                update: {
                    file: version_mobile_api.file,
                    signature: version_mobile_api.signature,
                    mobile_api_version: version_mobile_api.mobile_api_version,
                    created_date: new Date(version_mobile_api.created_date),
                    update_date: new Date(version_mobile_api.update_date),
                },
                create: {
                    id: version_mobile_api.id,
                    file: version_mobile_api.file,
                    signature: version_mobile_api.signature,
                    mobile_api_version: version_mobile_api.mobile_api_version,
                    created_date: new Date(version_mobile_api.created_date),
                    update_date: new Date(version_mobile_api.update_date),
                },
            });
            // console.log(`\x1b[32mmobile API data successfully saved: ${versionMobileApi.id}\x1b[0m`);

            const appVersionData = await prisma.app_version.upsert({
                where: { id: appVersion.id },
                update: {
                    description: appVersion.description,
                    notes: appVersion.notes,
                    version: appVersion.version,
                    pub_date: appVersion.pub_date ? new Date(appVersion.pub_date) : null,
                    app_version_status: appVersion.app_version_status,
                    fk_version_big_screen: versionBigScreen.id,
                    fk_version_small_screen: versionSmallScreen.id,
                    fk_version_mobile_api: versionMobileApi.id,
                    update_date: new Date(appVersion.update_date),
                },
                create: {
                    id: appVersion.id,
                    description: appVersion.description,
                    notes: appVersion.notes,
                    version: appVersion.version,
                    pub_date: appVersion.pub_date ? new Date(appVersion.pub_date) : null,
                    app_version_status: appVersion.app_version_status,
                    fk_version_big_screen: versionBigScreen.id,
                    fk_version_small_screen: versionSmallScreen.id,
                    fk_version_mobile_api: versionMobileApi.id,
                    created_date: new Date(appVersion.created_date),
                    update_date: new Date(appVersion.update_date),
                },
            });
            // console.log(`\x1b[32mApp version data successfully saved: ${appVersionData.id}\x1b[0m`);

        }

    } catch (error: any) {
        console.error('Failed to synchronize data:', error.message);
    }
};

export {
    consumeVersionData,
    fetchInitialVersionData
}
