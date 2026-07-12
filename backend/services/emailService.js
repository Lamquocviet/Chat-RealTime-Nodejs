import { transporter, verifyEmailTransport } from "../config/mailer.js";

export const sendResetPasswordEmail = async (email, link) => {
  console.log("Sending password reset email to:", email);
  console.log("Reset link:", link);

  const senderEmail =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    transporter.options?.auth?.user;

  if (!senderEmail) {
    throw new Error("No sender email configured for password reset.");
  }

  try {
    await verifyEmailTransport();

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
  } catch (error) {
    console.error("Password reset email sending failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown email sending error"
    );
  }
};