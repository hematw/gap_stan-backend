import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import sendMail from "../utils/email-sender.js";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // seven days
  httpOnly: true,
  secure: true,
};

// Register route controller
export const registerUser = asyncHandler(async (req, res) => {
  // , firstName, lastName
  console.log(req.body);
  const { username, email, password } = req.body;

  const createdUser = await User.create({
    username,
    email,
    password,
    // firstName,
    // lastName,
  });

  const otp = Math.floor(100000 + Math.random() * 900000);

  createdUser.otp = otp;
  createdUser.otpExpiry = Date.now() + 5 * 60 * 60 * 1000; // 5 minutes
  await createdUser.save();

  const x = await sendMail(createdUser, otp);
  console.log(x)
  return res
    .status(200)
    .json({ email: createdUser.email, username: createdUser.username });
});

// Login route controller
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Both email and password are required!" });
  }

  const foundUser = await User.findOne({
    $or: [{ email }, { username: email }],
  });

  if (!foundUser.verifiedAt) { 
    return res.status(401).json({message: "Please verify your account first."})
  }

  if (foundUser && (await foundUser.isPasswordCorrect(password))) {

    const token = await foundUser.generateToken();
    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({ token, user: foundUser });
  }
  return res.status(401).json({ message: "Email or password was wrong!" });
});

// Logout route controller
export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("token", cookieOptions)
    .json({ message: "Logged out successfully" });
});

export const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (user) {
    return res.status(200).json({ message: "Username is already taken!" });
  } else {
    return res.status(409).json({ message: "Username is available!" });
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email, otp: otp })

  const isExpired = (User.otpExpiry - Date.now()) > 0;

  if (!isExpired) {
    user.verifiedAt = Date.now()
    await user.save()
    const token = await user.generateToken()
    return res.status(200).json({ user, token })
  }
  return res.status(401).json({ message: "Verification failed" })
})
