import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        // participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        participants: [
          {
            userId,
            role: "owner",
          },

          ...memberIds.map((id) => ({
            userId: id,
            role: "member",
          })),
        ],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res
        .status(400)
        .json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      role: p.role,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };
    //Khi tạo group chat, server sẽ gửi thông báo realtime tới tất cả thành viên.
    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        role: p.role,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString(); //middleware auth đã gán req.user

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res
        .status(200)
        .json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        new: true,
      },
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/* Để xem danh sách thành viên trong nhóm, bạn cần:

Tìm Conversation theo conversationId
Kiểm tra đây có phải nhóm (type = "group") hay không
Populate thông tin User từ participants.userId
Trả về danh sách thành viên */

// Lấy danh sách thành viên nhóm
export const getGroupMembers = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findById(conversationId).populate({
      path: "participants.userId",
      select: "_id displayName username avatarUrl",
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Conversation is not a group" });
    }

    const members = conversation.participants.map((participant) => ({
      userId: participant.userId,
      displayName: participant.userId?.displayName,
      username: participant.userId?.username,
      avatarUrl: participant.userId?.avatarUrl,
      role: participant.role,
      joinedAt: participant.joinedAt,
    }));

    return res.status(200).json({ total: members.length, members });
  } catch (error) {
    console.error("Lỗi khi lấy thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
// Thêm thành viên vào nhóm chat
export const addMembers = async (req, res) => {
  const { conversationId } = req.params;
  const { memberIds } = req.body;

  try {

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0
    ) {
      return res.status(400).json({
        message: "memberIds is required",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({message: "Conversation not found",});        
    }

    if (conversation.type !== "group") {
      return res.status(400).json({
        message:
          "Only group conversations can add members",
      });
    }

    const me = conversation.participants.find(
      (p) =>
        p.userId.toString() ===
        req.user._id.toString()
    );

    if (!me) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    if (!["owner", "admin"].includes(me.role)) {
      return res.status(403).json({
        message:
          "Only owner/admin can add members",
      });
    }

    // Loại bỏ trùng lặp trong request
    const uniqueMemberIds = [...new Set(memberIds)];

    for (const memberId of uniqueMemberIds) {
      // Không cho tự thêm chính mình
      if (
        memberId.toString() ===
        req.user._id.toString()
      ) {
        continue;
      }

      const exists = conversation.participants.some(
        (p) =>
          p.userId.toString() === memberId.toString()
      );

      if (!exists) {
        conversation.participants.push({
          userId: memberId,
          role: "member",
        });
      }
    }

    await conversation.save();

    await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });

    const participants = conversation.participants.map(
      (p) => ({
        _id: p.userId._id,
        displayName: p.userId.displayName,
        avatarUrl: p.userId.avatarUrl,
        role: p.role,
        joinedAt: p.joinedAt,
      })
    );

    return res.status(200).json({
  message: "Members added successfully",
  conversation: {
    ...conversation.toObject(),
    participants,
  },
});
  } catch (error) {
    console.error("Error adding members:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
// Xóa thành viên khỏi nhóm chat
export const removeMember = async (req, res) => {
  try {
    const { conversationId, memberId } = req.params;

    const myId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }
    if (conversation.type !== "group") {
      return res
        .status(400)
        .json({ message: "Only group conversations can add members" });
    }

    const me = conversation.participants.find(
      (p) =>
        p.userId.toString() ===
        myId.toString()
    );

    if (!me || me.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can remove",
      });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== memberId
    );

    await conversation.save();

    await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });

    const participants = conversation.participants.map((p) => ({
      _id: p.userId._id,
      displayName: p.userId.displayName,
      avatarUrl: p.userId.avatarUrl,
      role: p.role,
      joinedAt: p.joinedAt,
    }));

    return res.status(200).json({
      message: "Member removed",
      conversation: {
        ...conversation.toObject(),
        participants,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};
// Rời nhóm chat
export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const myId = req.user._id;

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }
    if (conversation.type !== "group") {
      return res
        .status(400)
        .json({ message: "Only group conversations can add members" });
    }


    const me = conversation.participants.find(
      (p) =>
        p.userId.toString() ===
        myId.toString()
    );

    if (!me) {
      return res.status(404).json({
        message: "Not in group",
      });
    }

    // owner
    if (me.role === "owner" && conversation.participants.length === 1) {
      await Conversation.findByIdAndDelete(conversationId);
      await Message.deleteMany({conversationId});

      return res.status(200).json({
        message:
          "Group deleted because owner left",
        deleted: true,
        conversationId,
      });
    }
     // Nếu owner rời nhóm -> chuyển quyền
     if (me.role === "owner") {
      let nextOwner = conversation.participants.find(
        (p) =>
          p.userId.toString() !== myId.toString() &&
          p.role === "admin"
      );

      if (!nextOwner) {
        nextOwner = conversation.participants.find(
          (p) => p.userId.toString() !== myId.toString()
        );
      }

      if (nextOwner) {
        nextOwner.role = "owner";
      }
     }

     // Xóa bản thân khỏi nhóm
     conversation.participants = conversation.participants.filter((p) => p.userId.toString() !== myId.toString());

     await conversation.save();

     await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",

     });

     const participants =
      conversation.participants.map((p) => ({
        _id: p.userId._id,
        displayName:
          p.userId.displayName,
        avatarUrl:
          p.userId.avatarUrl,
        role: p.role,
        joinedAt: p.joinedAt,
      }));

    return res.status(200).json({
      message: "Left group successfully",
      deleted: false,
      conversation: {
        ...conversation.toObject(),
        participants,
      },
    });
    
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
}
// Giải tán nhóm chat
export const deleteConversation = async (req, res) => {

  const {conversationId} = req.params;
  try {
    const conversation = await Conversation.findById(conversationId);
    if(!conversation){
      return res.status(404).json({message: "Conversation not found"});
    }
    if(conversation.type !== "group"){
      return res.status(400).json({message: "Only group conversation can be deleted"});
    }

    const me = conversation.participants.find(
      (p) =>
        p.userId.toString() ===
        req.user._id.toString()
    );

    if (!me || me.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can delete conversation",
      });
    }
    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({conversationId});

    return res.status(200).json({message: "Conversation deleted"});

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Server error" });
  }
}