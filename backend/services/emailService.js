import { transporter } from "../config/mailer.js";


export const sendResetPasswordEmail = async (email, link) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Password",
    html: `
      <h2>Password Reset</h2>

      <p>Click the button below to reset your password.</p>

      <a href="${link}">
        Reset Password
      </a>

      <p>This link will expire in 15 minutes.</p>
    `,
  });
};