import { Router } from 'express';
import authRouter from './auth.routes.js';
import chatRouter from './chat.routes.js';

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/chats', chatRouter);

export default mainRouter;