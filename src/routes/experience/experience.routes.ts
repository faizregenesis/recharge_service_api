import express from 'express';
import {
    experience, 
    postExperience
} from './experience.controller';

class experienceRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/experience', experience);
        this.router.post('/experience', postExperience);
    }
}

export default new experienceRoutes().router;
