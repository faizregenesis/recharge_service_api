import express from 'express';
import {
    properties, 
    addproperties
} from './properties.controller';

class propertiesRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/properties', properties);
        this.router.post('/properties', addproperties);
    }
}

export default new propertiesRoutes().router;
