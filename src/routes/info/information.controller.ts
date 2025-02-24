import { Request, Response } from 'express';

const information = async (req: Request, res: Response): Promise<any> => {
    try {
        return res.status(200).json({
            message: "Hallo from API service"
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ 
            message: "Internal server error" 
        });
    }
};

export {
    information
}
