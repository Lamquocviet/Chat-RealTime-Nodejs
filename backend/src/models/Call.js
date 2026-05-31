import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["audio", "video"],
      default: "video",
    },

    status: {
      type: String,
      enum: [
        "calling",
        "accepted",
        "rejected",
        "ended",
        "missed",
      ],
      default: "calling",
    },

    startedAt: Date,

    endedAt: Date,

    duration: Number, // in seconds
  },
  {
    timestamps: true,
    indexes: [
      { caller: 1, createdAt: -1 },
      { receiver: 1, createdAt: -1 },
      { status: 1 },
    ],
  }
);

export default mongoose.model(
  "Call",
  callSchema
);
