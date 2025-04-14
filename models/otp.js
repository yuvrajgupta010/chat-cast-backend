const mongoose = require("mongoose");
const { RESET_PASSWORD_OTP, VERIFICATION_OTP } = require("@/helpers/constant");

const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    otp: {
      type: Number,
      required: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    userEmail: { type: String, required: true },
    useFor: {
      type: String,
      required: true,
      enum: [RESET_PASSWORD_OTP, VERIFICATION_OTP],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
