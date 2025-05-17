import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.EMAIL_APP_PASS,
  },
});

export default async function sendMail(user, otp) {
  return await transporter.sendMail({
    to: user.email,
    subject: "Gapistan Signup Verification",
    text: "Verfication email",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .otp-code {
      display: inline-block;
      padding: 10px 20px;
      background-color:rgb(44, 218, 96);
      color: #ffffff;
      font-size: 24px;
      letter-spacing: 4px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h2>OTP Verification</h2>
    </div>
    <p>Hi ${user.username},</p>
    <p>Use the OTP code below to complete your verification process:</p>

    <div class="otp-code">${otp}</div>

    <p>This code is valid for the next 10 minutes. Do not share it with anyone.</p>
    <p>If you didn’t request this code, you can safely ignore this email.</p>

    <div class="footer">
      &copy; 2025 Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`,
  });
}
