import express from 'express';
import {
    experience
} from './experience.controller';

class experienceRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/experience', experience);
    }
}

export default new experienceRoutes().router;
