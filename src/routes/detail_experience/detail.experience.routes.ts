import express from 'express';
import {
    detailExperience, 
    postDetailExperience
} from './detail.experience.controller';

class detailExperienceRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/detail/experience', detailExperience);
        this.router.post('/detail/experience', postDetailExperience);
    }
}

export default new detailExperienceRoutes().router;
