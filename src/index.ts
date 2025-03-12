import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import routes from './app';

import {
    runInitialFetchingData, 
    runFunctionsInOrder, 
} from './order.sync.manager';

// runInitialFetchingData()
runFunctionsInOrder()

const app = express();
app.use(express.json());
app.use(routes); 

const port = 3000;
const host = `${process.env.HOST}`;

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
