import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const selfDeveopment = async (req: Request, res: Response):Promise<any> => {
    try {
        const selfDevelopment = await prisma.self_development.findMany({
            where: { 
                deleted_at: null 
            }, 
            orderBy: {
                created_date: "desc"
            }
        });

        if (selfDevelopment.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: selfDevelopment 
            });
        }

        const totalData = selfDevelopment.length

        return res.status(200).json({ 
            message: "success to get self development data", 
            total_data: totalData,
            data: selfDevelopment 
        });
    } catch (error) {
        console.error("Error fetching detail experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const addselfDeveopment = async (req: Request, res: Response):Promise<any> => {
    try {
        const { self_development_name, description, icon } = req.body

        if (!self_development_name || !description || !icon ) {
            return res.status(400).json({
                message: "body sould not empty"
            })
        }

        const selfDevelopment = await prisma.self_development.create({
            data: {
                self_development_name : self_development_name, 
                description: description, 
                icon: icon
            }
        });

        return res.status(200).json({ 
            message: "success to add self development data", 
            data: selfDevelopment 
        });
    } catch (error) {
        console.error("Error fetching detail experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const selfDeveopmentSound = async (req: Request, res: Response):Promise<any> => {
    try {
        const selfDevSound = await prisma.self_development_sound.findMany({
            where: { 
                deleted_at: null 
            }, 
            orderBy: {
                created_date: "desc"
            }
        });

        if (selfDevSound.length === 0) {
            return res.status(404).json({ 
                message: "database empty", 
                data: selfDevSound 
            });
        }

        const totalData = selfDevSound.length

        return res.status(200).json({ 
            message: "success to get self development sound data", 
            total_data: totalData,
            data: selfDevSound 
        });
    } catch (error) {
        console.error("Error fetching detail experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

const addselfDeveopmentSound = async (req: Request, res: Response):Promise<any> => {
    try {
        const {sound_code, duration, description, sound_path, file_path, title, caption} = req.body

        const selfDevSound = await prisma.self_development_sound.create({
            data: {
                sound_code: sound_code, 
                duration: duration, 
                description: description, 
                sound_path: sound_path, 
                file_path: file_path, 
                title: title, 
                caption: caption
            }
        });

        return res.status(200).json({ 
            message: "success to add self development sound data", 
            data: selfDevSound 
        });
    } catch (error) {
        console.error("Error fetching detail experience data:", error);
        res.status(500).json({ 
            message: "Internal server error.", 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export {
    selfDeveopment,
    addselfDeveopment,

    selfDeveopmentSound, 
    addselfDeveopmentSound
}
