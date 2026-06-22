import AuditLog from "../models/AuditLog.js";

export const createAuditLog = async ({
  actor,

  action,

  targetType,

  targetId,

  details = {},

  ipAddress,
}) => {
  try {
    const log = await AuditLog.create({
      actor,

      action,

      targetType,

      targetId,

      details,

      ipAddress,
    });

    return log;
  } catch (error) {
    console.error("Create audit log error:", error);
  }
};
