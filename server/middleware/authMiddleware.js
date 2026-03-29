import jwt from "jsonwebtoken";
import User from "../models/User.js";


/**
 * Protect middleware - Verify JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {

    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }

  } else {
    return res.status(401).json({ message: "No token" });
  }
};

/**
 * Admin-only middleware - Check if user role is admin
 */
export const adminOnly = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin only access" });
  }
};