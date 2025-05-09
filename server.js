import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./db/connect.js";
import initSocket from "./utils/socket.js";
import mainRouter from "./routes/index.js";
import errorHandler from "./middlewares/error-handler.js";
import authHandler from "./middlewares/auth-handler.js";
import morgan from "morgan";

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(morgan("dev"));

app.get("/", (req, res) => {
  console.log("Whooho you came to Home.")
  res.send("Welcome to the chat app API!");
});

app.get("/secure", authHandler, (req, res) => {
  console.log("Authenticated user:", req.user)
  res.send("This route was really secure!");
});

app.use("/api", mainRouter)

app.use(errorHandler)

const server = http.createServer(app);
const io = initSocket(server)

const port = process.env.PORT || 3000;

server.listen(port, async () => {
  await connectDB(process.env.MONGO_URI);
  console.log(`🚀 Server & WebSocket running on port ${port}!`);
});

