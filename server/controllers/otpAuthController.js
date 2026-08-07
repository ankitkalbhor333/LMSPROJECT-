import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendOTPSMS } from "../services/smsService.js";
import { normalizePhone } from "../utils/otpUtil.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
};

const generateJWT = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role || "student" },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body || {};
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`,
        role: "student",
        phoneVerified: false,
      });
    }

    user.phoneOTP = otp;
    user.phoneOTPExpiry = otpExpiry;
    await user.save();

    const smsResult = await sendOTPSMS(normalizedPhone, otp);

    if (!smsResult.success) {
      console.error("OTP send failed:", smsResult.error);
      return res.status(500).json({ success: false, message: "Failed to send OTP", error: smsResult.error });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      phone: normalizedPhone,
      debug: process.env.NODE_ENV === "development" ? { otp } : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    if (!otp || !/^[0-9]{6}$/.test(String(otp).trim())) {
      return res.status(400).json({ success: false, message: "Invalid OTP format" });
    }

    const user = await User.findOne({ phone: normalizedPhone });

    if (!user || !user.phoneOTP || !user.phoneOTPExpiry) {
      return res.status(400).json({ success: false, message: "OTP not requested or invalid phone number" });
    }

    if (new Date() > new Date(user.phoneOTPExpiry)) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (String(user.phoneOTP).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    user.phoneVerified = true;
    user.phoneOTP = null;
    user.phoneOTPExpiry = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateJWT(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ success: false, message: "OTP verification failed", error: error.message });
  }
};
