import { Router } from "express";
import { createChatAndSendMessage, createGroup, deleteMessage, getChatMessages, getChats, searchForChats, sendMessage, uploadFiles } from "../controllers/chat.controller.js";
import authHandler from "../middlewares/auth-handler.js";
import upload from "../utils/multer.js";

const chatRouter = Router();

chatRouter.use(authHandler)

chatRouter.get("/", getChats)

chatRouter.get("/search", searchForChats)

chatRouter.get("/:chatId", getChatMessages)



chatRouter.put('/deleteMessage/:id', deleteMessage);

chatRouter.post('/:chatId/upload', upload.array("files"), uploadFiles);

chatRouter.post('/group', upload.single("profile"),  createGroup);

chatRouter.post('/:chatId', upload.array('media'), sendMessage);

chatRouter.post('/new', createChatAndSendMessage);

export default chatRouter; 