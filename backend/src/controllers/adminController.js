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
      module: "ADMIN",
      action: "DELETE_USER",
      targetType: "user",
      targetId: deleteUser._id,
      details: {
        username: deleteUser.username,
        email: deleteUser.email,
      },
      ipAddress: req.ip,
      req,
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
      module: "ADMIN",
      action: "CHANGE_ROLE",
      targetType: "user",
      targetId: user._id,
      details: {
        from: previousRole,
        to: user.role,
      },
      ipAddress: req.ip,
      req,
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
      module: "ADMIN",
      action: "CHANGE_ROLE",
      targetType: "user",
      targetId: user._id,
      details: {
        from: previousRole,
        to: user.role,
      },
      ipAddress: req.ip,
      req,
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
      module: "ADMIN",
      action: "BLOCK_USER",
      targetType: "user",
      targetId: user._id,
      details: {
        username: user.username,
        status: user.status,
      },
      ipAddress: req.ip,
      req,
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
      module: "ADMIN",
      action: "UNBLOCK_USER",
      targetType: "user",
      targetId: user._id,
      details: {
        username: user.username,
        status: user.status,
      },
      ipAddress: req.ip,
      req,
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


export const getUserStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const nextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      newUsersToday,
      newUsersMonth,
      usersByDay,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        status: "active",
      }),

      User.countDocuments({
        status: "blocked",
      }),

      User.countDocuments({
        createdAt: {
          $gte: today,
        },
      }),

      User.countDocuments({
        createdAt: {
          $gte: firstDayOfMonth,
        },
      }),

      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: firstDayOfMonth,
              $lt: nextMonth,
            },
          },
        },
        {
          $group: {
            _id: {
              $dayOfMonth: "$createdAt",
            },
            users: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    const onlineCount = onlineUsers.size;

    const inactiveUsers = Math.max(activeUsers - onlineCount, 0);

    // số ngày trong tháng
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    const chart = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const found = usersByDay.find((d) => d._id === day);

      chart.push({
        day,
        users: found ? found.users : 0,
      });
    }

    return res.status(200).json({
      summary: {
        totalUsers,
        activeUsers,
        blockedUsers,
        inactiveUsers,
        onlineUsers: onlineCount,
        newUsersToday,
        newUsersMonth,
      },

      distribution: [
        {
          name: "Active Users",
          value: activeUsers,
        },
        {
          name: "Blocked Users",
          value: blockedUsers,
        },
        {
          name: "Online Users",
          value: onlineCount,
        },
        {
          name: "Inactive Users",
          value: inactiveUsers,
        },
      ],

      newUsersChart: chart,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Audit-log
export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const {
      module,
      action,
      status,
      severity,
      actor,
      actorRole,
      targetType,
      startDate,
      endDate,
      search,
    } = req.query;

    const filter = {};

    if (module) filter.module = module;

    if (action) filter.action = action;

    if (status) filter.status = status;

    if (severity) filter.severity = severity;

    if (actor) filter.actor = actor;

    if (actorRole) filter.actorRole = actorRole;

    if (targetType) filter.targetType = targetType;

    // Filter theo ngày
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate)
        filter.createdAt.$gte = new Date(startDate);

      if (endDate)
        filter.createdAt.$lte = new Date(endDate);
    }

    // Search tên người dùng hoặc tên đối tượng
    if (search) {
      filter.$or = [
        {
          actorName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          targetName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate(
          "actor",
          "displayName username avatarUrl role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      page,

      limit,

      total,

      totalPages: Math.ceil(total / limit),

      logs,
    });
  } catch (error) {
    console.error("Get audit logs:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// audit-logs/stats
export const getAuditLogStats = async (req, res) => {
  try {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const [
      totalLogs,
      logsToday,
      failedActions,
      userActions,
      adminActions,
      authenticationActions,
    ] = await Promise.all([
      AuditLog.countDocuments(),

      AuditLog.countDocuments({
        createdAt: {
          $gte: startToday,
        },
      }),

      AuditLog.countDocuments({
        status: "FAILED",
      }),

      AuditLog.countDocuments({
        module: "USER",
      }),

      AuditLog.countDocuments({
        module: "ADMIN",
      }),

      AuditLog.countDocuments({
        module: "AUTH",
      }),
    ]);

    res.status(200).json({
      success: true,

      stats: {
        totalLogs,
        logsToday,
        failedActions,
        userActions,
        adminActions,
        authenticationActions,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};