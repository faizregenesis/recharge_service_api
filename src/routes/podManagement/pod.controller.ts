import { Request, Response } from 'express';
import prisma from "../../../prisma/prisma";
const dotenv = require('dotenv');
dotenv.config();

const deletePodUrgentOnly = async (req: Request, res: Response): Promise<any> => {
    try {
        const pod_id = req.params.pod_id

        const getExperienceData = await prisma.experiences2.findMany({
            where: {
                pod_id: pod_id
            }
        })
        const expId = getExperienceData.map(id => id.id)

        const getDetailExp = await prisma.detail_experience2.findMany({
            where: {
                experience_id: {
                    in: expId
                }
            }
        })
        const detailExpId = getDetailExp.map(id => id.id)

        // hapus detail exp
        const deleteDetail = await prisma.detail_experience2.deleteMany({
            where: {
                id: {in: detailExpId}, 
                experience_id: {in: expId}
            }
        })
        console.log("detail experience deleted: ", deleteDetail);

        // delete Experience data
        const deleteExperience = await prisma.experiences2.deleteMany({
            where: {
                id: {in: expId}
            }
        })
        console.log("experience deleted: ", deleteExperience);

        const getSelfDevData = await prisma.self_development2.findMany({
            where: {
                fk_pod_id: pod_id
            }
        })
        const selfDevId = getSelfDevData.map(id => id.id)

        const getSelfDevSound = await prisma.self_development_sound2.findMany({
            where: {
                self_development_id: {
                    in: selfDevId
                }
            }
        })
        const selfDevSoundId = getSelfDevSound.map(id => id.id)

        // delete selfDev sound 
        const deleteSelfDevSound = await prisma.self_development_sound2.deleteMany({
            where: {
                id: {
                    in: selfDevSoundId
                }, 
                self_development_id: {
                    in: selfDevId
                }
            }
        })
        console.log("self dev sound deleted: ", deleteSelfDevSound);

        const deleteSelfDevData = await prisma.self_development2.deleteMany({
            where: {id: {in: selfDevId}}
        })
        console.log("self dev data deleted: ", deleteSelfDevData);

        const deletePodData = await prisma.pod.delete({
            where: {
                id: pod_id
            }
        })
        console.log("pod deleted: ", deletePodData.id);

        return res.status(200).json({
            message: "success to deleete data", 
            data: {
                pod_id: pod_id, 
                selfDevId: selfDevId, 
                selfDevSoundId: selfDevSoundId, 
                expId: expId, 
                detailExpId: detailExpId
            }
        })
    } catch (error) {
        res.status(500).json({
            error
        });
    }
};

export {
    deletePodUrgentOnly
}
