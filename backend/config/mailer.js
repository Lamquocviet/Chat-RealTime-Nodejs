import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const useGmailService = process.env.SMTP_SERVICE === "gmail" || smtpHost.includes("gmail.com");


export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});
export const verifyEmailTransport = async () => {
  if (!smtpUser || !smtpPass) {
    throw new Error(
      "SMTP credentials are not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS in your Render environment."
    );
  }

  if (smtpUser.includes("gmail.com") && smtpPass.length < 16) {
    throw new Error(
      "For Gmail SMTP, SMTP_PASS must be a Google App Password, not your normal Gmail password."
    );
  }

  await transporter.verify();
};