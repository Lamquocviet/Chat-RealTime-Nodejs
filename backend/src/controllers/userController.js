import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res
        .status(400)
        .json({ message: "Phải cung cấp username để tìm kiếm" });
    }

    const user = await User.findOne({ username }).select(
      "_id username avatarUrl displayName",
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, phone, email } = req.body;

    const updateData = {};
    console.log("userId:", userId);
    console.log("updateData:", updateData);
    if (displayName) {
      updateData.displayName = displayName.trim();
    }
    if (bio) {
      updateData.bio = bio.trim();
    }
    if (phone) {
      updateData.phone = phone.trim();
    }
    if (email) {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
      updateData.email = email.trim().toLowerCase();
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("_id username displayName email phone bio avatarUrl");

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi updateProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "_id username displayName email phone bio avatarUrl",
    );

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi lấy profile user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      },
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};
