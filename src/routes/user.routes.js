
import { Router } from 'express';
import { getUsers, updateUser } from '../controllers/users.controller.js';
import upload from '../utils/multer.js';

const usersRouter = Router();

usersRouter.get('/', getUsers)
usersRouter.put("/:id", upload.single("profile"), updateUser)

export default usersRouter;