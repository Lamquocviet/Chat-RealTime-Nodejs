import express from "express";
import {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallHistory,
} from "../controllers/callController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes cần authentication
router.use(protectedRoute);

router.post("/initiate", initiateCall);
router.patch("/:callId/accept", acceptCall);
router.patch("/:callId/reject", rejectCall);
router.patch("/:callId/end", endCall);
router.get("/history", getCallHistory);

export default router;
