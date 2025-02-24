import express from 'express';
import {
    information
} from './information.controller';

class informationRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('', information);
    }
}

export default new informationRoutes().router;
