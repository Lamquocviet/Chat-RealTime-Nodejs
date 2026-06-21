import User from "../models/User.js";

// xem danh sách user
export const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        // .sort({createAt: -1})
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Get all users error", error);
    return res.status(500).json({
      sucess: false,
      message: "Server error",
    });
  }
};

// xóa account user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: "You cannot delete yourselt",
      });
    }

    const deleteUser = await User.findByIdAndDelete(userId);
    if (!deleteUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error delete user", error);
    return res.status(500).json("Server error");
  }
};

// Nâng quyền user → admin
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        sucess: false,
        message: "User is already an admin",
      });
    }

    user.role = "admin";
    await user.save();

    return res.status(200).json({
      success: true,
      messgae: "User promoted to admin successfully",
      user,
    });
  } catch (error) {
    console.error("Promte user error", error);
    return res.status(500).json({
      sucess: false,
      message: "Server error",
    });
  }
};

// Ha quyền admin → user
export const demoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: "You cannot demote yourself",
      });
    }

    if (user.role === "user") {
      return res.status(400).json({
        sucess: false,
        message: "User is already a regular user",
      });
    }

    user.role = "user";
    await user.save();

    return res.status(200).json({
      success: true,
      messgae: "Admin demoted to user successfully",
      user,
    });
  } catch (error) {
    console.error("Promte user error", error);
    return res.status(500).json({
      sucess: false,
      message: "Server error",
    });
  }
};

//  account
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: "You cannot block yourself",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }

    user.status = "blocked";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user,
    });
  } catch (error) {
    console.error("Block user error", error);
    return res.status(500).json({
      sucess: false,
      message: "Server error",
    });
  }
};

// Active account
export const activeUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }

    user.status = "active";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User active successfully",
      user,
    });
  } catch (error) {
    console.error("Active user error", error);
    return res.status(500).json({
      sucess: false,
      message: "Server error",
    });
  }
};
