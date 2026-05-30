import express from "express";
import { authMe, searchUserByUsername, updateProfile } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadAvatar } from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.patch("/updateProfile", protectedRoute, updateProfile);


export default router;
