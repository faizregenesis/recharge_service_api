import { WebSocketServer } from "ws";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const wss = new WebSocketServer({ 
    port: 8080 
});

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
        if (message.toString() === "get_experiences") {
            const experienceData = await prisma.experiences.findMany({
                where: { 
                    deleted_at: null 
                },
            });

            console.log(experienceData);
            ws.send(JSON.stringify(experienceData));
        }
    });

    ws.on("close", () => console.log("Client disconnected"));
});

const experience = async (req: Request, res: Response): Promise<any> => {
    try {
        const experienceData = await prisma.experiences.findMany({
            where: { 
                deleted_at: null 
            },
        });

        if (experienceData.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: experienceData 
            });
        }

        return res.status(200).json({ 
            message: "success to get experience data", 
            data: experienceData 
        });
    } catch (error) {
        console.error("Error fetching experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const properties = async (req: Request, res: Response): Promise<any> => {
    try {
        const propertiesData = await prisma.experiences_properties.findMany({
            where: { 
                deleted_at: null 
            },
        });

        if (propertiesData.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: propertiesData 
            });
        }

        return res.status(200).json({ 
            message: "success to get experience data", 
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
    experience, 
    properties
}
