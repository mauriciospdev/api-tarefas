import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

export const app = express();

app.use(express.json());
app.use(routes);
app.use(errorHandler);
