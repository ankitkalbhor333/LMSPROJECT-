import jwt from "jsonwebtoken";
import User from "../models/User.js";

const normalizePhone = (value = "") => String(value).replace(/\D/g, "");

const toIndian10Digit = (value = "") => {
  const digits = normalizePhone(value);

  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

const PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * POST /api/register
 * Registers (or returns) a user after frontend Firebase OTP verification.
 */
export const registerUserByPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = toIndian10Digit(phone);

    if (!normalizedPhone) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ msg: "Invalid phone number format" });
    }

    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`,
        isVerified: true,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || "student" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      msg: "User authenticated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role || "student",
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Register User By Phone Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};
