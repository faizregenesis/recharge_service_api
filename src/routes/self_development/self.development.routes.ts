import express from 'express';
import {
    selfDeveopment, 
    addselfDeveopment,
    selfDeveopmentSound, 
    addselfDeveopmentSound
} from './self.development.controller';

class selfDevData {
    public router = express.Router();
    constructor() {
        this.router.get('/self/dev', selfDeveopment);
        this.router.post('/self/dev', addselfDeveopment);

        this.router.get('/self/dev/sound', selfDeveopmentSound);
        this.router.post('/self/dev/sound/pppp', addselfDeveopmentSound);
    }
}

export default new selfDevData().router;
