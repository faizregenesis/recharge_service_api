import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const detailExperience = async (req: Request, res: Response):Promise<any> => {
    try {
        const experienceData = await prisma.detail_experience.findMany({
            where: { 
                deleted_at: null 
            }, 
            orderBy: {
                created_at: "desc"
            }
        });

        if (experienceData.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: experienceData 
            });
        }

        const totalData = experienceData.length

        return res.status(200).json({ 
            message: "success to get detail experience data", 
            total_data: totalData,
            data: experienceData 
        });
    } catch (error) {
        console.error("Error fetching detail experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const postDetailExperience = async (req: Request, res: Response): Promise<any> => {
    try {
        const experiences = req.body;

        if (!Array.isArray(experiences) || experiences.length === 0) {
            return res.status(400).json({ 
                message: "Invalid request data, expected an array of objects." 
            });
        }

        const data = await prisma.detail_experience.createMany({
            data: experiences,
            skipDuplicates: true,
        });

        return res.status(201).json({
            message: "Success to create experience data", 
            count: data.count,
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export {
    detailExperience, 
    postDetailExperience
}
