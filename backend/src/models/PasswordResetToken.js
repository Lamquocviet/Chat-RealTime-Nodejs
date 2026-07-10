import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,

      // Mongo tự xóa document khi hết hạn
      expires: 0,
    },

    used: {
      type: Boolean,
      default: false,
    },

    createdByIp: String,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("PasswordResetToken", passwordResetTokenSchema);
