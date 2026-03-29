import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

/**
 * Create Razorpay Order
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, courseId } = req.body;

    if (!amount || !courseId) {
      return res.status(400).json({ message: "Amount and courseId are required" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Create order with Razorpay
    // Build a short receipt id (Razorpay requires <= 40 chars)
    const shortCourseId = String(courseId).substring(0, 8);
    const receipt = `course_${shortCourseId}_${Date.now()}`; // ~28 chars

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt,
      notes: {
        courseId: courseId,
        courseName: course.title,
      },
    };

    console.log("📦 Creating Razorpay order:", options, "(receipt length=", receipt.length, ")");

    const order = await razorpay.orders.create(options);

    console.log("✅ Order created:", order.id);

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseId: courseId,
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create order",
      error: error.message 
    });
  }
};

/**
 * Verify Payment & Enroll Student
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, amount } = req.body;
    
    // Validate required payment data
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing payment signature data");
      return res.status(400).json({ 
        success: false,
        message: "Missing payment signature verification data (order_id, payment_id, or signature)" 
      });
    }
    
    // Validate course
    if (!courseId) {
      console.error("❌ Missing courseId in verification request");
      return res.status(400).json({ 
        success: false,
        message: "Course ID is required" 
      });
    }
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
      console.error("❌ User not authenticated or missing _id");
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }
    
    const userId = req.user._id;
    console.log("🔐 Payment verification started");
    console.log("   User:", userId);
    console.log("   Course:", courseId);
    console.log("   Payment ID:", razorpay_payment_id);
    console.log("   Order ID:", razorpay_order_id);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("🔑 Signature verification:");
    console.log("   Received:  ", razorpay_signature?.substring(0, 10) + "...");
    console.log("   Expected:  ", expectedSignature?.substring(0, 10) + "...");
    console.log("   Body to sign:", body);

    if (expectedSignature === razorpay_signature) {
      console.log("✅ Signature verified successfully");

      // Check if payment already exists (duplicate prevention)
      const existingPayment = await Payment.findOne({
        paymentId: razorpay_payment_id
      });

      if (existingPayment) {
        console.log("📌 Payment already processed:", existingPayment._id);
        
        // Check if enrollment already exists
        let enrollment = await Enrollment.findOne({
          paymentId: existingPayment._id
        });

        if (enrollment) {
          return res.status(200).json({
            success: true,
            message: "Payment already verified and processed",
            paymentId: existingPayment._id,
            courseId: courseId,
            enrollmentId: enrollment._id,
            duplicate: true
          });
        }
      }

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        userId: userId,
        courseId: courseId,
        status: { $in: ["active", "completed"] }
      });

      if (existingEnrollment) {
        return res.status(400).json({ 
          success: false,
          message: "Already enrolled in this course" 
        });
      }

      // Step 1: Create Payment record in database
      const payment = await Payment.create({
        userId: userId,
        courseId: courseId,
        amount: req.body.amount || 0, // Should be sent from frontend
        finalAmount: req.body.amount || 0,
        currency: "INR",
        gatewayName: "razorpay",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        status: "completed",
        paymentDate: new Date()
      });

      console.log("✅ Payment record created:", payment._id);

      // Step 2: Create Enrollment record linked to Payment
      let enrollment;
      let shouldIncrementEnrollmentCount = false;
      try {
        enrollment = await Enrollment.create({
          userId: userId,
          courseId: courseId,
          paymentId: payment._id, // Link to Payment document
          status: "active",
          enrollmentDate: new Date()
        });
        console.log("✅ Enrollment record created:", enrollment._id);
        shouldIncrementEnrollmentCount = true;
      } catch (enrollmentError) {
        // Handle duplicate enrollment or index issues
        if (enrollmentError.code === 11000) {
          console.error("⚠️ Duplicate enrollment detected:", enrollmentError.keyValue);
          // Try to find existing enrollment
          const existingEnrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
          });
          if (existingEnrollment) {
            console.log("📌 Existing enrollment found:", existingEnrollment._id);
            enrollment = existingEnrollment;
            shouldIncrementEnrollmentCount = false;
            // Update payment link if not already set
            if (!existingEnrollment.paymentId) {
              await Enrollment.findByIdAndUpdate(
                existingEnrollment._id,
                { paymentId: payment._id },
                { returnDocument: 'after' }
              );
            }
          } else {
            throw enrollmentError;
          }
        } else {
          throw enrollmentError;
        }
      }

      // Step 3: Link Payment to Enrollment
      await Payment.findByIdAndUpdate(
        payment._id,
        { enrollmentId: enrollment._id },
        { returnDocument: 'after' }
      );

      console.log("✅ Payment linked to Enrollment");

      // Step 4: Update course - increment enrollment count
      if (shouldIncrementEnrollmentCount) {
        const course = await Course.findByIdAndUpdate(
          courseId,
          { $inc: { enrollmentCount: 1 } },
          { returnDocument: 'after' }
        );

        console.log("✅ Course enrollment count updated:", course?.enrollmentCount);
      } else {
        console.log("ℹ️ Enrollment already existed; skipped course enrollment count increment");
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified and enrollment successful",
        paymentId: payment._id,
        courseId: courseId,
        enrollmentId: enrollment._id
      });
    } else {
      console.error("❌ Signature verification failed");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }
  } catch (error) {
    console.error("❌ Payment verification error:", error.message || error);
    console.error("   Error Code:", error.code);
    console.error("   Error Stack:", error.stack);
    
    // Handle specific error types
    let statusCode = 500;
    let message = "Payment verification failed";
    
    if (error.code === 11000) {
      statusCode = 400;
      message = "Duplicate payment or enrollment - already processed";
    } else if (error.message?.includes("validation failed")) {
      statusCode = 400;
      message = "Invalid payment data";
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

/**
 * Get Payment Status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log("🔍 Fetching payment status:", paymentId);

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      description: payment.description,
    });
  } catch (error) {
    console.error("❌ Payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
      error: error.message,
    });
  }
};

/**
 * Refund Payment
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    console.log("💰 Processing refund for:", paymentId);

    const refund = await razorpay.payments.refund(paymentId, {
      amount: 0, // 0 = full refund
    });

    console.log("✅ Refund processed:", refund.id);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error) {
    console.error("❌ Refund error:", error);
    res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message,
    });
  }
};
