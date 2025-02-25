import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const properties = async (req: Request, res: Response): Promise<any> => {
    try {
        const propertiesData = await prisma.experiences_properties.findMany({
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
            message: "success to get properties data", 
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

const addproperties = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            circle_line_color, 
            circle_line_width, 
            circle_fill_color, 
            circle_icon, 
            circle_caption, 
            circle_size, 
            enable_disable_session, 
            order, 
            tooltip, 
            icon, 
            experience_id, 
        } = req.body

        const propertiesData = await prisma.experiences_properties.create({
            data: {
                circle_line_color, 
                circle_line_width, 
                circle_fill_color, 
                circle_icon, 
                circle_caption, 
                circle_size, 
                enable_disable_session, 
                order, 
                tooltip, 
                icon, 
                experience_id, 
            }
        });

        return res.status(200).json({ 
            message: "success to add properties data", 
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
    properties, 
    addproperties
}
