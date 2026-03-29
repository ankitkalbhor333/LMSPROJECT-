import express from "express";
import { registerUserByPhone } from "../controllers/registerController.js";

const router = express.Router();

// Frontend calls this after Firebase OTP verification succeeds.
router.post("/register", registerUserByPhone);

export default router;
