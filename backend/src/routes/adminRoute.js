import express from "express"
import { activeUser, getAuditLogs, getAuditLogStats, blockUser, deleteUser, getAllUsers, getUserStats, promoteToAdmin, demoteToAdmin } from "../controllers/adminController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.use(isAdmin);

router.get("/stats/users", getUserStats)
router.get("/", getAllUsers);
router.get("/audit-log", getAuditLogs)
router.get("/stats-log", getAuditLogStats)
router.delete("/:userId", deleteUser);
router.patch("/:userId/promote", promoteToAdmin);
router.patch("/:userId/demote", demoteToAdmin)
router.patch("/:userId/block", blockUser);
router.patch("/:userId/active", activeUser)

export default router;