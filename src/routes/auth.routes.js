import { Router } from "express";

const authRouter = Router();

import { registerUser, loginUser, logoutUser, verifyOtp } from "../controllers/auth.controller.js";

authRouter.post("/signup", registerUser);
authRouter.post("/signin", loginUser);
authRouter.post("/signout", logoutUser);
authRouter.post("/verify-otp", verifyOtp);

export default authRouter;