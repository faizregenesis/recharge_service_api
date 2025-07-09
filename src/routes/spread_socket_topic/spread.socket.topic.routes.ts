import express from 'express';
import {
    socketTopic, 
    podTopic, 
    templateProperties, 
    addSocketTopic,
    addpPodTopic, 
    addTaskType
} from './spread.socket.topic.controller';

class socketTopicRoutes {
    public router = express.Router();
    constructor() {
        this.router.get('/socket/topic', socketTopic);
        this.router.get('/pod/topic', podTopic);
        this.router.get('/template/properties', templateProperties);

        this.router.post('/socket/topic', addSocketTopic);
        this.router.post('/pod/topic', addpPodTopic);
        this.router.post('/task/type', addTaskType);
    }
}

export default new socketTopicRoutes().router;
