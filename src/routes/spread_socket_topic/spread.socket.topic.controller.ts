import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios"; 
const prisma = new PrismaClient();

import {
    quePodTopicData, 
    queSocketTopicData
} from './publish.to..queue';

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
        console.error("Error fetching socket topic data:", error);
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
        console.error("Error fetching pod topic data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const templateProperties = async (req: Request, res: Response): Promise<any> => {
    try {
        const propertiesData = await prisma.template_properties.findMany({
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
            message: "success to get template properties data", 
            totalData: totalData,
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching tempalate propertie data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const addSocketTopic = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            module_name,
            event_description,
            topic,
            action,
            retain,
            publish_example_value,
            subscribe_example_value,
            value_range,
            remarks,
            keyword,
            auth_status,
        } = req.body

        const propertiesData = await prisma.socket_topics.create({
            data: { 
                module_name,
                event_description,
                topic,
                action,
                retain,
                publish_example_value,
                subscribe_example_value,
                value_range,
                remarks,
                keyword,
                auth_status,
            },
        });

        await queSocketTopicData(propertiesData)

        return res.status(200).json({ 
            message: "success to add socket topic data", 
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching socket topic data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const addpPodTopic = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            module_name,
            event_description,
            topic,
            action,
            retain,
            publish_example_value,
            subscribe_example_value,
            value_range,
            remarks,
            keyword,
        } = req.body

        const propertiesData = await prisma.pod_topics.create({
            data: { 
                module_name,
                event_description,
                topic,
                action,
                retain,
                publish_example_value,
                subscribe_example_value,
                value_range,
                remarks,
                keyword, 
            },
        });

        await quePodTopicData(propertiesData)

        return res.status(200).json({ 
            message: "success to add pod topic data", 
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching pod topic data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const addTaskType = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            code,
            name,
            small_screen,
            big_screen,
            number_of_input,
            number_of_output,
            back,
            home,
            settings,
            template_style,
            template_tooltips,
        } = req.body

        const propertiesData = await prisma.task_type.create({
            data: { 
                code,
                name,
                small_screen,
                big_screen,
                number_of_input,
                number_of_output,
                back,
                home,
                settings,
                template_style,
                template_tooltips,
            },
        });

        return res.status(200).json({ 
            message: "success to add template properties data", 
            data: propertiesData 
        });
    } catch (error) {
        console.error("Error fetching tempalate propertie data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export {
    socketTopic, 
    podTopic, 
    templateProperties, 
    addSocketTopic,
    addpPodTopic, 
    addTaskType
}
