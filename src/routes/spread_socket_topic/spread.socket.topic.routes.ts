import express from 'express';
import {
    socketTopic, 
    podTopic
} from './spread.socket.topic.controller';

class socketTopicRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/socket/topic', socketTopic);
        this.router.get('/pod/topic', podTopic);
    }
}

export default new socketTopicRoutes().router;
