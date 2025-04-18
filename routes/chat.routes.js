import { Router } from "express";
import { getChatMessages, getChats } from "../controllers/chat.controller";

const router = Router();

router.get("/", getChats)

router.get("/:chatId", getChatMessages)