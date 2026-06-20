import Message from "../models/Message.js";
import { uploadFileFromBuffer } from "../middlewares/uploadMiddleware.js";
// import {
//   emitNewMessage,
//   updateConversationAfterCreateMessage,
// } from "./messageHelper.js";

import { io } from "../socket/index.js";

export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId,
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  });
};

export const uploadAttachments = async (files = []) => {
  if (!files.length) return [];

  return Promise.all(
    files.map(async (file) => {
      const result = await uploadFileFromBuffer(file.buffer);

      return {
        url: result.secure_url,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    })
  );
};

export const getMessageType = (attachments = []) => {
  if (!attachments.length) {
    return "text";
  }

  const allImages = attachments.every((file) => {
    const mimeType = file.mimetype || file.mimeType;
    return mimeType?.startsWith("image/");
  });

  return allImages ? "image" : "file";
};

export const createMessage = async ({
  conversation,
  conversationId,
  senderId,
  content,
  attachments,
}) => {
  const message =
    await Message.create({
      conversationId,

      senderId,

      content,

      attachments,

      type:
        getMessageType(
          attachments
        ),
    });

  updateConversationAfterCreateMessage(
    conversation,
    message,
    senderId
  );

  await conversation.save();

  emitNewMessage(
    io,
    conversation,
    message
  );

  return message;
};
