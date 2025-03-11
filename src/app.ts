import { json, urlencoded } from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import information from './routes/info/information.routes';
import experience from './routes/experience/experience.routes';
import properties from './routes/properties/properties.routes';
import detailExperience from './routes/detail_experience/detail.experience.routes';
import selfDevData from './routes/self_development/self.development.routes';
import socketTopicRoutes from './routes/spread_socket_topic/spread.socket.topic.routes';

class App {
    public httpServer = express();

    constructor() {
        this.httpServer.use(json({ limit: '500mb' }));
        this.httpServer.use(urlencoded({ extended: true, limit: '500mb' }));
        this.httpServer.use((req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header(
                'Access-Control-Allow-Headers',
                'Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Authorization, X-CSRFToken, X-Authorization',
            );
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, PATCH, OPTIONS, DELETE');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.httpServer.set('trust proxy', true);

        this.httpServer.use('/', information);
        this.httpServer.use('/service-api', experience);
        this.httpServer.use('/service-api', detailExperience);
        this.httpServer.use('/service-api', properties);
        this.httpServer.use('/service-api', selfDevData);
        this.httpServer.use('/service-api', socketTopicRoutes);

        this.httpServer.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.log(`error in url ${req.originalUrl} - error: ${err}`);
            next();
        });

        process.once('uncaughtException', (err: Error) => {
            console.log(err.name, err.message);
            console.log('UNCAUGHT EXCEPTION!  Shutting down...');
            process.exit(1);
        });

        process.once('unhandledRejection', (reason: Error) => {
            console.log(reason.name, reason.message);
            console.log('UNHANDLED REJECTION! 💥 Shutting down...');
            process.exit(1);
        });
    }
}

export default new App().httpServer;
