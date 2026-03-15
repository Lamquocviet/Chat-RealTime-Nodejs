import express from "express";
import { authMe, searchUserByUsername } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadAvatar } from "../controllers/userController.js";
const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

export default router;
