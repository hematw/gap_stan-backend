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

export default async function sendMail(user, url) {
  return await transporter.sendMail({
    to: user.email,
    subject: "Gapistan Signup Verification",
    text: "Verfication email",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title></title>
        <style type="text/css" rel="stylesheet" media="all">
        /* Base ------------------------------ */
        
        @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
        body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            -webkit-text-size-adjust: none;
        }
        
        a {
            color: #3869D4;
        }
        
        a img {
            border: none;
        }
        
        td {
            word-break: break-word;
        }
        
        .preheader {
            display: none !important;
            visibility: hidden;
            mso-hide: all;
            font-size: 1px;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
        }
        /* Type ------------------------------ */
        
        body,
        td,
        th {
            font-family: "Nunito Sans", Helvetica, Arial, sans-serif;
        }
        
        h1 {
            margin-top: 0;
            color: #333333;
            font-size: 22px;
            font-weight: bold;
            text-align: left;
        }
        
        h2 {
            margin-top: 0;
            color: #333333;
            font-size: 16px;
            font-weight: bold;
            text-align: left;
        }
        
        h3 {
            margin-top: 0;
            color: #333333;
            font-size: 14px;
            font-weight: bold;
            text-align: left;
        }
        
        td,
        th {
            font-size: 16px;
        }
        
        p,
        ul,
        ol,
        blockquote {
            margin: .4em 0 1.1875em;
            font-size: 16px;
            line-height: 1.625;
        }
        
        p.sub {
            font-size: 13px;
        }
        /* Utilities ------------------------------ */
        
        .align-right {
            text-align: right;
        }
        
        .align-left {
            text-align: left;
        }
        
        .align-center {
            text-align: center;
        }
        
        .u-margin-bottom-none {
            margin-bottom: 0;
        }
        /* Buttons ------------------------------ */
        
        .button {
            background-color: #3869D4;
            border-top: 10px solid #3869D4;
            border-right: 18px solid #3869D4;
            border-bottom: 10px solid #3869D4;
            border-left: 18px solid #3869D4;
            display: inline-block;
            color: #FFF;
            text-decoration: none;
            border-radius: 3px;
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
            -webkit-text-size-adjust: none;
            box-sizing: border-box;
        }
        
        .button-white {
            background-color: #000;
            border-top: 10px solid #000;
            border-right: 18px solid #000;
            border-bottom: 10px solid #000;
            border-left: 18px solid #000;
        }
        
        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
                text-align: center !important;
            }
        }
        </style>
    </head>
    <body>
        <span class="preheader">Use this link to verify your email address and complete your signup.</span>
        <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center">
                    <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td class="email-masthead">
                                <a href="https://example.com" class="f-fallback email-masthead_name">
                                Gapistan
                            </a>
                            </td>
                        </tr>
                        <!-- Email Body -->
                        <tr>
                            <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                    <!-- Body content -->
                                    <tr>
                                        <td class="content-cell">
                                            <div class="f-fallback">
                                                <h1>Hi ${user.firstName} ${user.lastName},</h1>
                                                <p>Thank you for signing up for Gapistan! Please verify your email address by clicking the button below. This verification link is only valid for the next 24 hours.</p>
                                                <!-- Action -->
                                                <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                                    <tr>
                                                        <td align="center">
                                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                                <tr>
                                                                    <td align="center">
                                                                        <a href="${url}" class="f-fallback button button-white" target="_blank">Verify your email</a>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <p>If you did not sign up for Gapistan, please ignore this email.</p>
                                                <p>Thanks,
                                                    <br>The Gapistan team</p>
                                                <!-- Sub copy -->
                                                <table class="body-sub" role="presentation">
                                                    <tr>
                                                        <td>
                                                            <p class="f-fallback sub">If you’re having trouble with the button above, copy and paste the URL below into your web browser.</p>
                                                            <p class="f-fallback sub">${url}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                        <td class="content-cell" align="center">
                                            <p class="f-fallback sub align-center">
                                                ATOM Software
                                                <br>Kabul
                                                <br>Afghanistan
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`,
  });
}
