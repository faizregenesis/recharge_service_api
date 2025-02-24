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

const port = `${process.env.PORT}`;
const host = `${process.env.HOST}`;

console.log("ini adalah port:", port);
console.log("ini adalah host:", `${host}`);

app.listen(3000, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
