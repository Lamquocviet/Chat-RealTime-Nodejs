import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Người thực hiện
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actorName: {
      type: String,
      required: true,
      trim: true,
    },

    actorRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      index: true,
    },
    // Module
    module: {
      type: String,
      enum: ["AUTH", "USER", "ADMIN", "REPORT", "SYSTEM"],
      required: true,
      index: true,
    },
    // Action
    action: {
      type: String,
      required: true,
      enum: [
        // Authentication
        "REGISTER",
        "LOGIN",
        "LOGOUT",
        "VERIFY_EMAIL",
        "FORGOT_PASSWORD_REQUEST",
        "RESET_PASSWORD",
        "CHANGE_PASSWORD",

        // User
        "UPDATE_PROFILE",
        "DELETE_ACCOUNT",

        // Admin
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "BLOCK_USER",
        "UNBLOCK_USER",
        "CHANGE_ROLE",

        "DELETE_POST",
        "DELETE_STORY",
        "DELETE_COMMENT",
        "DELETE_GROUP",

        // Report
        "CREATE_REPORT",
        "RESOLVE_REPORT",

        // System
        "EXPORT_USERS",
        "EXPORT_AUDIT_LOG",
        "VIEW_DASHBOARD",
      ],
      index: true,
    },

    // Đối tượng bị tác động
    targetType: {
      type: String,
      enum: ["user", "post", "story", "comment", "group", "report", "system"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    targetName: {
      type: String,
      default: "",
    },
    // Request
    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },

    requestPath: String,

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
      index: true,
    },

    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "INFO",
      index: true,
    },

    description: String,

    errorMessage: String,

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Client
    ipAddress: String,

    userAgent: String,

    browser: String,

    operatingSystem: String,

    device: String,

    sessionId: String,

    duration: Number,
  },
  {
    timestamps: true,
  },
);
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, status: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
