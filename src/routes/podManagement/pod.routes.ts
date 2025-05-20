import express from 'express';

import {
    deletePodUrgentOnly
} from './pod.controller';

class podRoutes {
    public router = express.Router();
    constructor() {
        this.router.delete('/delete/:pod_id', deletePodUrgentOnly);
    }
}

export default new podRoutes().router;
