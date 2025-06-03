
import { Router } from 'express';
import { getPublicKey, getUsers, updateUser, uploadPublicKey } from '../controllers/users.controller.js';
import upload from '../utils/multer.js';

const usersRouter = Router();

usersRouter.get('/', getUsers)
usersRouter.put("/:id", upload.single("profile"), updateUser)
usersRouter.put("/:id/public-key", uploadPublicKey);
usersRouter.get("/:id/public-key", getPublicKey);

export default usersRouter;