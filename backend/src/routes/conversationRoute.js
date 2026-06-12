import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  getGroupMembers,
  addMembers,
  removeMember,
  leaveGroup,
  deleteConversation,

} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.post("/:conversationId/members", addMembers);
router.delete("/:conversationId/members/:memberId", removeMember);
router.delete("/:conversationId/leave", leaveGroup);
router.delete("/:conversationId", deleteConversation);
router.get("/", getConversations);
router.get("/:conversationId/members", getGroupMembers);

router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);

export default router;
