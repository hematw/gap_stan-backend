import { Router } from "express";

const authRouter = Router();

import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";

authRouter.post("/signup", registerUser);
authRouter.post("/signin", loginUser);
authRouter.post("/signout", logoutUser);

export default authRouter;