import mongoose from "mongoose";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const MODULE_BY_ACTION = {
  REGISTER: "AUTH",
  LOGIN: "AUTH",
  LOGOUT: "AUTH",
  VERIFY_EMAIL: "AUTH",
  FORGOT_PASSWORD_REQUEST: "AUTH",
  RESET_PASSWORD: "AUTH",
  CHANGE_PASSWORD: "AUTH",
  CREATE_USER: "AUTH",
  UPDATE_PROFILE: "USER",
  DELETE_ACCOUNT: "USER",
  UPDATE_USER: "ADMIN",
  DELETE_USER: "ADMIN",
  BLOCK_USER: "ADMIN",
  UNBLOCK_USER: "ADMIN",
  CHANGE_ROLE: "ADMIN",
  CREATE_REPORT: "REPORT",
  RESOLVE_REPORT: "REPORT",
  EXPORT_USERS: "SYSTEM",
  EXPORT_AUDIT_LOG: "SYSTEM",
  VIEW_DASHBOARD: "SYSTEM",
};

const buildClientInfo = (req) => {
  const userAgent = req?.headers?.["user-agent"] || "";

  let browser = "Unknown";
  if (/edg\//i.test(userAgent)) browser = "Edge";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/opera|opr\//i.test(userAgent)) browser = "Opera";

  let operatingSystem = "Unknown";
  if (/windows/i.test(userAgent)) operatingSystem = "Windows";
  else if (/mac os/i.test(userAgent)) operatingSystem = "macOS";
  else if (/linux/i.test(userAgent)) operatingSystem = "Linux";
  else if (/android/i.test(userAgent)) operatingSystem = "Android";
  else if (/iphone|ipad/i.test(userAgent)) operatingSystem = "iOS";

  const device = /mobile|android|iphone|ipad/i.test(userAgent)
    ? "Mobile"
    : "Desktop";

  return {
    userAgent,
    browser,
    operatingSystem,
    device,
  };
};

const resolveActorInfo = async (actor, req) => {
  let actorId = actor;
  let actorRecord = null;

  if (actor && typeof actor === "object" && actor._id) {
    actorId = actor._id;
  }

  if (actorId) {
    actorRecord = await User.findById(actorId).select("displayName username role");
  } else if (req?.user?._id) {
    actorId = req.user._id;
    actorRecord = await User.findById(actorId).select("displayName username role");
  }

  if (!actorId) {
    actorId = new mongoose.Types.ObjectId();
  }

  return {
    actorId,
    actorName: actorRecord?.displayName || actorRecord?.username || req?.user?.displayName || req?.user?.username || "System",
    actorRole: actorRecord?.role || req?.user?.role || "user",
  };
};

const resolveTargetName = async (targetType, targetId, targetName, details = {}) => {
  if (targetName) return targetName;

  if (targetType === "user" && targetId) {
    const targetUser = await User.findById(targetId).select("displayName username");
    if (targetUser) {
      return targetUser.displayName || targetUser.username || "";
    }
  }

  if (details?.username) {
    return details.username;
  }

  if (details?.email) {
    return details.email;
  }

  return "";
};

export const createAuditLog = async ({
  actor,
  action,
  targetType = "system",
  targetId,
  details = {},
  ipAddress,
  req,
  module,
  status = "SUCCESS",
  severity = "INFO",
  description,
  errorMessage,
  requestMethod,
  requestPath,
  userAgent,
  browser,
  operatingSystem,
  device,
  sessionId,
  duration,
  targetName,
}) => {
  try {
    if (!action) {
      console.warn("Create audit log skipped: missing action");
      return null;
    }

    const normalizedAction = String(action).toUpperCase();
    const normalizedModule = module || MODULE_BY_ACTION[normalizedAction] || "SYSTEM";
    const clientInfo = buildClientInfo(req);
    const { actorId, actorName, actorRole } = await resolveActorInfo(actor, req);
    const resolvedTargetName = await resolveTargetName(
      targetType,
      targetId,
      targetName,
      details,
    );

    const log = await AuditLog.create({
      actor: actorId,
      actorName,
      actorRole,
      module: normalizedModule,
      action: normalizedAction,
      targetType,
      targetId,
      targetName: resolvedTargetName,
      requestMethod: requestMethod || req?.method?.toUpperCase(),
      requestPath: requestPath || req?.originalUrl || req?.url || "",
      status: String(status).toUpperCase(),
      severity: String(severity).toUpperCase(),
      description:
        description || `${actorName} performed ${normalizedAction}`,
      errorMessage,
      details,
      ipAddress:
        ipAddress ||
        req?.ip ||
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        "",
      userAgent: userAgent || clientInfo.userAgent,
      browser: browser || clientInfo.browser,
      operatingSystem: operatingSystem || clientInfo.operatingSystem,
      device: device || clientInfo.device,
      sessionId: sessionId || req?.headers?.["x-session-id"] || req?.cookies?.sessionId || "",
      duration,
    });

    return log;
  } catch (error) {
    console.warn("Create audit log skipped:", error.message);
    return null;
  }
};
