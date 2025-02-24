import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import routes from './app';

import {
    runFunctionsInOrder
} from './order.sync.manager';

runFunctionsInOrder()

const app = express();
app.use(express.json());
app.use(routes); 

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
