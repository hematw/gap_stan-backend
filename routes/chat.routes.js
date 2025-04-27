import { Router } from "express";
import { createChatAndSendMessage, deleteMessage, getChatMessages, getChats, searchForChats, sendMessage } from "../controllers/chat.controller.js";
import multer from "multer";
import path from "path";
import authHandler from "../middlewares/auth-handler.js";

const chatRouter = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/chat-media/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

chatRouter.use(authHandler)

chatRouter.get("/", getChats)

chatRouter.get("/search", searchForChats)

chatRouter.get("/:chatId", getChatMessages)



chatRouter.put('/deleteMessage/:id', deleteMessage);

chatRouter.get('/', getChats);

chatRouter.get('/:chatId', getChatMessages);

chatRouter.post('/:chatId', upload.array('media'), sendMessage);

chatRouter.post('/new', createChatAndSendMessage);

export default chatRouter; 