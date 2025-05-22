import { Router } from "express";
import { addToGroupChat, createChatAndSendMessage, createGroup, deleteMessage, getChatFilesAndMedia, getChatMembers, getChatMessages, getChats, removeFromChat, searchForChats, sendMessage, uploadFiles } from "../controllers/chat.controller.js";
import authHandler from "../middlewares/auth-handler.js";
import upload from "../utils/multer.js";

const chatRouter = Router();

chatRouter.use(authHandler)

chatRouter.get("/", getChats)

chatRouter.get("/search", searchForChats)

chatRouter.get("/:chatId", getChatMessages)

chatRouter.get("/:chatId/files", getChatFilesAndMedia)

chatRouter.get("/:chatId/members", getChatMembers)


chatRouter.put('/deleteMessage/:id', deleteMessage);

chatRouter.post('/:chatId/upload', upload.array("files"), uploadFiles);

chatRouter.post('/group', upload.single("profile"), createGroup);

chatRouter.post('/:chatId', upload.array('media'), sendMessage);

chatRouter.post('/:chatId/members', addToGroupChat);

chatRouter.delete('/:chatId/members/:memberToRemove', removeFromChat);

chatRouter.post('/new', createChatAndSendMessage);

export default chatRouter; 