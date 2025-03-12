import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios"; 
const prisma = new PrismaClient();

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

export {
    socketTopic, 
    podTopic, 
}
