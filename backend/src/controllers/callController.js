import Call from "../models/Call.js";
import User from "../models/User.js";

/**
 * Khởi tạo cuộc gọi
 * POST /api/calls/initiate
 */
export const initiateCall = async (req, res) => {
  try {
    const callerId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID là bắt buộc" });
    }

    if (callerId.toString() === receiverId) {
      return res.status(400).json({ message: "Không thể gọi cho chính mình" });
    }

    // Kiểm tra receiver tồn tại
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra có cuộc gọi đang diễn ra không (calling or accepted)
    const activeCall = await Call.findOne({
      $or: [
        {
          caller: callerId,
          receiver: receiverId,
          status: { $in: ["calling", "accepted"] },
        },
        {
          caller: receiverId,
          receiver: callerId,
          status: { $in: ["calling", "accepted"] },
        },
      ],
    });
    if (activeCall) {
      // If the active call is stale (older than 2 minutes) mark it as missed and allow new call
      const twoMinutes = 2 * 60 * 1000;
      const age = Date.now() - new Date(activeCall.createdAt).getTime();
      if (age > twoMinutes) {
        activeCall.status = "missed";
        await activeCall.save();
      } else {
        return res.status(400).json({ message: "Có cuộc gọi đang diễn ra" });
      }
    }

    // Tạo document cuộc gọi với status 'calling'
    const newCall = new Call({
      caller: callerId,
      receiver: receiverId,
      type: "video",
      status: "calling",
    });

    await newCall.save();

    return res
      .status(201)
      .json({ call: newCall, message: "Cuộc gọi được tạo" });
  } catch (error) {
    console.error("Lỗi khi khởi tạo cuộc gọi:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * Chấp nhận cuộc gọi
 * PATCH /api/calls/:callId/accept
 */
export const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await Call.findById(callId);
    if (!call)
      return res.status(404).json({ message: "Cuộc gọi không tồn tại" });

    if (call.receiver.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không phải người nhận cuộc gọi này" });
    }

    call.status = "accepted";
    call.startedAt = new Date();
    await call.save();

    return res
      .status(200)
      .json({ call, message: "Cuộc gọi đã được chấp nhận" });
  } catch (error) {
    console.error("Lỗi khi chấp nhận cuộc gọi:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * Từ chối cuộc gọi
 * PATCH /api/calls/:callId/reject
 */
export const rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await Call.findById(callId);
    if (!call)
      return res.status(404).json({ message: "Cuộc gọi không tồn tại" });

    if (call.receiver.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không phải người nhận cuộc gọi này" });
    }

    call.status = "rejected";
    await call.save();

    return res.status(200).json({ call, message: "Cuộc gọi bị từ chối" });
  } catch (error) {
    console.error("Lỗi khi từ chối cuộc gọi:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Kết thúc cuộc gọi
// PATCH /api/calls/:callId/end
export const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await Call.findById(callId);
    if (!call)
      return res.status(404).json({ message: "Cuộc gọi không tồn tại" });

    if (
      call.caller.toString() !== userId.toString() &&
      call.receiver.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không phải người trong cuộc gọi này" });
    }

    call.status = "ended";
    call.endedAt = new Date();
    call.duration = call.startedAt
      ? Math.floor((call.endedAt - call.startedAt) / 1000)
      : 0;
    await call.save();

    return res.status(200).json({ call, message: "Cuộc gọi kết thúc" });
  } catch (error) {
    console.error("Lỗi khi kết thúc cuộc gọi:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * Lấy lịch sử cuộc gọi của người dùng
 * GET /api/calls/history
 */
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0 } = req.query;

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "username displayName avatarUrl")
      .populate("receiver", "username displayName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Call.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
    });

    return res.status(200).json({
      calls,
      total,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử cuộc gọi:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
