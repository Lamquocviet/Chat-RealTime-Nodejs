// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { createAuditLog } from "../utils/auditHelper.js";
import { sendResetPasswordEmail } from "../../services/emailService.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_TTL,
  };
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedUsername || !password || !normalizedEmail || !firstName || !lastName) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, email, firstName, và lastName",
      });
    }

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username: normalizedUsername });

    if (duplicate) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }

    const duplicateEmail = await User.findOne({ email: normalizedEmail });
    if(duplicateEmail)
    {
      return res.status(409).json({message: "email đã tồn tại"})
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // tạo user mới
    const newUser = await User.create({
      username: normalizedUsername,
      hashedPassword,
      email: normalizedEmail,
      displayName: `${firstName} ${lastName}`,
    });

    await createAuditLog({
      actor: newUser._id,
      action: "CREATE_USER",
      targetType: "user",
      targetId: newUser._id,
      details: {
        username: newUser.username,
        email: newUser.email,
      },
      ipAddress: req.ip,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    // lấy inputs
    const { username, password } = req.body;
    const normalizedIdentifier = typeof username === "string" ? username.trim().toLowerCase() : "";

    if (!normalizedIdentifier || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    // lấy hashedPassword trong db để so với password input
    const user = await User.findOne({
      $or: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // chặn user đã bị khóa
    if (user.status === "blocked") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    }

    // nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    await createAuditLog({
      actor: user._id,
      action: "LOGIN",
      targetType: "user",
      targetId: user._id,
      details: {
        username: user.username,
      },
      ipAddress: req.ip,
    });

    // trả access token về trong res
    return res
      .status(200)
      .json({ message: `User ${user.displayName} đã logged in!`, accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // xoá refresh token trong Session
      await Session.deleteOne({ refreshToken: token });

      // xoá cookie
      res.clearCookie("refreshToken");
    }

    await createAuditLog({
      actor: req.user._id,
      action: "LOGOUT",
      targetType: "user",
      targetId: req.user._id,
      details: {
        username: req.user.username,
      },
      ipAddress: req.ip,
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Đổi mật khẩu
export const changePassword = async (req, res) => {
    try {

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must contain uppercase, lowercase and number.",
            });
        }

        const user = await User.findById(req.user._id)
            .select("+hashedPassword");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const matched = await bcrypt.compare(
            currentPassword,
            user.hashedPassword
        );

        if (!matched) {
            return res.status(401).json({
                message: "Current password is incorrect",
            });
        }

        const samePassword = await bcrypt.compare(
            newPassword,
            user.hashedPassword
        );

        if (samePassword) {
            return res.status(400).json({
                message: "New password must be different",
            });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.save();

        // logout all devices
        await Session.deleteMany({
            userId: user._id,
        });

        res.clearCookie("refreshToken");

        await createAuditLog({
            actor: user._id,
            action: "CHANGE_PASSWORD",
            targetType: "user",
            targetId: user._id,
            ipAddress: req.ip,
        });
        
        console.log(req.headers["content-type"]);
console.log(req.body);
        return res.status(200).json({
            message: "Password changed successfully",
            logout: true,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};
// forget password
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Không tiết lộ email tồn tại hay không
    if (!user) {
      return res.status(200).json({
        message: "If the email exists, reset instructions have been sent.",
      });
    }

    await PasswordResetToken.deleteMany({
      userId: user._id,
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdByIp: req.ip,
    });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const link = `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendResetPasswordEmail(user.email, link);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return res.status(500).json({
        message: "Unable to send reset instructions right now. Please try again later.",
      });
    }

    await createAuditLog({
      actor: user._id,
      action: "FORGOT_PASSWORD_REQUEST",
      targetType: "user",
      targetId: user._id,
      details: {
        email: user.email,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: "If the email exists, reset instructions have been sent.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    const normalizedToken = typeof token === "string" ? decodeURIComponent(token).trim() : "";

    if (!normalizedToken || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Weak password",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(normalizedToken).digest("hex");

    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
    });

    if (!resetToken) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Token expired",
      });
    }

    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const samePassword = await bcrypt.compare(password, user.hashedPassword);

    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different",
      });
    }

    user.hashedPassword = await bcrypt.hash(password, 10);

    await user.save();

    resetToken.used = true;
    await resetToken.save();

    await PasswordResetToken.deleteMany({
      userId: user._id,
      _id: { $ne: resetToken._id },
    });

    await Session.deleteMany({
      userId: user._id,
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    await createAuditLog({
      actor: user._id,
      action: "RESET_PASSWORD",
      targetType: "user",
      targetId: user._id,
      details: {
        email: user.email,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};