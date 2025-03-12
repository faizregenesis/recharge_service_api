import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios"; 
const prisma = new PrismaClient();

const podUrl = "http://10.20.10.3:3000/service-api";

const socketTopic = async (req: Request, res: Response): Promise<any> => {
    try {
        const propertiesData = await prisma.socket_topics.findMany({
            where: { 
                deleted_at: null 
            },
        });

        const totalData = propertiesData.length

        if (propertiesData.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: propertiesData 
            });
        }

        return res.status(200).json({ 
            message: "success to get socket topic data", 
            totalData: totalData,
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const podTopic = async (req: Request, res: Response): Promise<any> => {
    try {
        const propertiesData = await prisma.pod_topics.findMany({
            where: { 
                deleted_at: null 
            },
        });

        const totalData = propertiesData.length

        if (propertiesData.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: propertiesData 
            });
        }

        return res.status(200).json({ 
            message: "success to get pod topic data", 
            totalData: totalData,
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const fetchInitialSocketTopic = async () => {
    try {
        const response = await axios.get(`${podUrl}/socket/topic`);
        const result = response.data;
        const initialData = result.data;

        console.log("LENGTH POD TOPIC DATA: ", initialData.length);

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format version: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("ADMIN DATABASE EMPTY", initialData);
        }

        for (const item of initialData) {
            await prisma.socket_topics.upsert({
                where: { id: item.id },
                update: {
                    module_name: item.module_name,
                    event_description: item.event_description,
                    topic: item.topic,
                    action: item.action,
                    retain: item.retain,
                    publish_example_value: item.publish_example_value,
                    subscribe_example_value: item.subscribe_example_value,
                    value_range: item.value_range,
                    remarks: item.remarks,
                    keyword: item.keyword,
                    auth_status: item.auth_status,
                    deleted_at: item.deleted_at ? new Date(item.deleted_at) : null,
                    update_date: new Date(),
                },
                create: {
                    id: item.id,
                    module_name: item.module_name,
                    event_description: item.event_description,
                    topic: item.topic,
                    action: item.action,
                    retain: item.retain,
                    publish_example_value: item.publish_example_value,
                    subscribe_example_value: item.subscribe_example_value,
                    value_range: item.value_range,
                    remarks: item.remarks,
                    keyword: item.keyword,
                    auth_status: item.auth_status,
                    deleted_at: item.deleted_at ? new Date(item.deleted_at) : null,
                    created_date: new Date(item.created_date),
                    update_date: new Date(item.update_date),
                },
            });
        }

        console.log("socket topic data successsfuly sync to database");
    } catch (error) {
        console.error('Failed to synchronize data:', error);
    } finally {
        await prisma.$disconnect();
    }
};

const fetchInitialPodTopic = async () => {
    try {
        const response = await axios.get(`${podUrl}/pod/topic`);
        const result = response.data;
        const initialData = result.data;

        console.log("LENGTH POD TOPIC DATA: ", initialData.length);

        if (!Array.isArray(initialData)) {
            throw new Error('Unexpected data format version: "data" is not an array');
        }

        if (initialData.length === 0) {
            return console.log("ADMIN DATABASE EMPTY", initialData);
        }

        for (const item of initialData) {
            await prisma.pod_topics.upsert({
                where: { id: item.id },
                update: {
                    module_name: item.module_name,
                    event_description: item.event_description,
                    topic: item.topic,
                    action: item.action,
                    retain: item.retain,
                    publish_example_value: item.publish_example_value,
                    subscribe_example_value: item.subscribe_example_value,
                    value_range: item.value_range,
                    remarks: item.remarks,
                    keyword: item.keyword,
                    deleted_at: item.deleted_at ? new Date(item.deleted_at) : null,
                    update_date: new Date(),
                },
                create: {
                    id: item.id,
                    module_name: item.module_name,
                    event_description: item.event_description,
                    topic: item.topic,
                    action: item.action,
                    retain: item.retain,
                    publish_example_value: item.publish_example_value,
                    subscribe_example_value: item.subscribe_example_value,
                    value_range: item.value_range,
                    remarks: item.remarks,
                    keyword: item.keyword,
                    deleted_at: item.deleted_at ? new Date(item.deleted_at) : null,
                    created_date: new Date(item.created_date),
                    update_date: new Date(item.update_date),
                },
            });
        }

        console.log("pod topic data successsfuly sync to database");
    } catch (error) {
        console.error('Failed to synchronize data:', error);
    } finally {
        await prisma.$disconnect();
    }
};

export {
    socketTopic, 
    podTopic, 
    fetchInitialSocketTopic, 
    fetchInitialPodTopic
}
