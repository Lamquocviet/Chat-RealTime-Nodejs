import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { onlineUsers } from "../socket/index.js";
import { createAuditLog } from "../utils/auditHelper.js";


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

    const usersWithOnlineStatus = users.map(
      (user) => ({
        ... user,
        isOnline: onlineUsers.has(user._id.toString())
      })
    )

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users: usersWithOnlineStatus,
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

    await createAuditLog({
      actor: req.user._id,
      action: "DELETE_USER",
      targetType: "user",
      targetId: deleteUser._id,
      details: {
        username: deleteUser.username,
        email: deleteUser.email,
      },
      ipAddress: req.ip,
    });

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

    const previousRole = user.role;
    user.role = "admin";
    await user.save();

    await createAuditLog({
      actor: req.user._id,
      action: "CHANGE_ROLE",
      targetType: "user",
      targetId: user._id,
      details: {
        from: previousRole,
        to: user.role,
      },
      ipAddress: req.ip,
    });

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

    const previousRole = user.role;
    user.role = "user";
    await user.save();

    await createAuditLog({
      actor: req.user._id,
      action: "CHANGE_ROLE",
      targetType: "user",
      targetId: user._id,
      details: {
        from: previousRole,
        to: user.role,
      },
      ipAddress: req.ip,
    });

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

// block account
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

    await createAuditLog({
      actor: req.user._id,
      action: "BLOCK_USER",
      targetType: "user",
      targetId: user._id,
      details: {
        username: user.username,
        status: user.status,
      },
      ipAddress: req.ip,
    });

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

    await createAuditLog({
      actor: req.user._id,
      action: "UNBLOCK_USER",
      targetType: "user",
      targetId: user._id,
      details: {
        username: user.username,
        status: user.status,
      },
      ipAddress: req.ip,
    });

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

// Thống kê
export const getUserStats = async (req, res) => {
  try {
		const today = new Date();
		today.setHours(0,0,0,0);

		const firstDayOfMonth = new Date (
			today.getFullYear(),
			today.getMonth(),
			1
		);

		const [totalUsers, activeUsers, blockedUsers, newUsersToday, newUsersMonth] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({status: "active"}),
			User.countDocuments({status: "blocked"}),
			User.countDocuments({
				createdAt: {$gte: today}
			}),
			User.countDocuments({
        createdAt: {
          $gte: firstDayOfMonth,
        },
      }),

		]);
		return res.status(200).json({
      totalUsers,
      activeUsers,
      blockedUsers,
      onlineUsers: onlineUsers.size,
      newUsersToday,
      // newUsersThisMonth,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Audit-log
export const getAuditLogs = async(req, res) => {

  try {


    const page =
      Number(req.query.page) || 1;


    const limit =
      Number(req.query.limit) || 20;



    const skip =
      (page - 1) * limit;



    const {
      action,
      targetType,
      actor
    } = req.query;



    const filter = {};



    if(action){

      filter.action = action;

    }



    if(targetType){

      filter.targetType = targetType;

    }



    if(actor){

      filter.actor = actor;

    }




    const [logs, total] = await Promise.all([


      AuditLog.find(filter)

        .populate(
          "actor",
          "displayName username avatarUrl"
        )

        .sort({
          createdAt:-1
        })

        .skip(skip)

        .limit(limit)

        .lean(),



      AuditLog.countDocuments(filter)



    ]);





    return res.status(200).json({

      success:true,

      page,

      limit,

      total,

      totalPages:
      Math.ceil(total / limit),


      logs

    });



  } catch(error){


    console.error(
      "Get audit-log error:",
      error
    );


    return res.status(500).json({

      success:false,

      message:"Server error"

    });


  }

};