import { Router } from "express";
import { getChatMessages, getChats } from "../controllers/chat.controller.js";

const chatRouter = Router();

chatRouter.get("/", getChats)

chatRouter.get("/:chatId", getChatMessages)

export default chatRouter; 