import express from "express"
import { blockUser, deleteUser, getAllUsers, promoteToAdmin } from "../controllers/adminController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.use(isAdmin);

router.get("/", getAllUsers);
router.delete("/:userId", deleteUser);
router.patch("/:userId/promote", promoteToAdmin);
router.patch("/:userId/block", blockUser);

export default router;