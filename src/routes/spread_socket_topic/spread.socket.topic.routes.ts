import express from 'express';
import {
    socketTopic, 
    podTopic, 
    templateProperties
} from './spread.socket.topic.controller';

class socketTopicRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/socket/topic', socketTopic);
        this.router.get('/pod/topic', podTopic);
        this.router.get('/template/properties', templateProperties);
    }
}

export default new socketTopicRoutes().router;
