import { transporter } from "../config/mailer.js";

export const sendResetPasswordEmail = async (email, link) => {
  console.log("Sending email to:", email);
  console.log("Reset link:", link);

  const senderEmail = process.env.EMAIL_USER || transporter.options?.auth?.user;

  await transporter.sendMail({
    from: senderEmail,
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