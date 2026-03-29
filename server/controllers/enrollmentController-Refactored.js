/**
 * REFACTORED ENROLLMENT CONTROLLER
 * 
 * Examples for how to use the new Enrollment schema
 * and supporting schemas (Payment, CourseProgress, etc.)
 */

import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import CourseProgress from "../models/CourseProgress.js";
import Certificate from "../models/Certificate.js";
import mongoose from "mongoose";

// ============================================================
// 1. ENROLL STUDENT IN COURSE (Main Enrollment Function)
// ============================================================

export const enrollStudentInCourse = async (userId, courseId, paymentDetails = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validation
    if (!userId || !courseId) {
      throw new Error("userId and courseId are required");
    }
    
    // Check if student already enrolled (unique index will prevent, but check first)
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId
    });
    
    if (existingEnrollment) {
      throw new Error("Student already enrolled in this course");
    }
    
    // Get course details
    const course = await Course.findById(courseId).populate("units");
    if (!course) {
      throw new Error("Course not found");
    }
    
    // Count total lectures
    const totalLectures = course.totalLectures || 0;
    
    // Create enrollment record
    const enrollment = await Enrollment.create(
      [{
        userId,
        courseId,
        status: "active",
        enrollmentDate: new Date(),
        courseThumbnail: course.thumbnail,
        courseTitle: course.title
      }],
      { session }
    );
    
    const enrollmentId = enrollment[0]._id;
    
    // Process payment if required
    let paymentId = null;
    if (paymentDetails && paymentDetails.amount > 0) {
      const payment = await Payment.create(
        [{
          userId,
          courseId,
          enrollmentId,
          status: "completed", // Assuming payment already processed
          gatewayName: paymentDetails.gatewayName || "razorpay",
          paymentId: paymentDetails.paymentId,
          orderId: paymentDetails.orderId,
          amount: paymentDetails.amount,
          finalAmount: paymentDetails.finalAmount,
          signature: paymentDetails.signature,
          paymentDate: new Date()
        }],
        { session }
      );
      
      paymentId = payment[0]._id;
    }
    
    // Create course progress tracking
    const courseProgress = await CourseProgress.create(
      [{
        enrollmentId,
        userId,
        courseId,
        totalLectures,
        lecturesCompleted: 0,
        completionPercentage: 0
      }],
      { session }
    );
    
    const progressId = courseProgress[0]._id;
    
    // Update enrollment with references
    await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        paymentId,
        progressId
      },
      { session }
    );
    
    // Update course enrollment count (IMPORTANT: denormalized)
    await Course.findByIdAndUpdate(
      courseId,
      { $inc: { enrollmentCount: 1 } },
      { session }
    );
    
    // Update teacher's course count if teacher (optional)
    if (course.teacher) {
      await User.findByIdAndUpdate(
        course.teacher,
        { $inc: { "teacherProfile.coursesCreated": 1 } },
        { session }
      );
    }
    
    await session.commitTransaction();
    
    // Return populated enrollment
    return await Enrollment.findById(enrollmentId)
      .populate("userId", "name email")
      .populate("courseId", "title thumbnail teacher")
      .populate("paymentId")
      .populate("progressId");
    
  } catch (error) {
    await session.abortTransaction();
    console.error("Enrollment error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================================
// 2. GET ALL COURSES ENROLLED BY A STUDENT
// ============================================================

export const getStudentCourses = async (userId, filter = {}) => {
  try {
    const query = {
      userId,
      status: { $in: ["active", "completed"] }
    };
    
    // Optional filters
    if (filter.status) query.status = filter.status;
    
    const enrollments = await Enrollment.find(query)
      .populate({
        path: "courseId",
        select: "title thumbnail price description teacher enrollmentCount rating level",
        populate: {
          path: "teacher",
          select: "name teacherProfile"
        }
      })
      .populate("progressId", "completionPercentage lecturesCompleted totalLectures")
      .sort({ createdAt: -1 });
    
    return enrollments;
    
  } catch (error) {
    console.error("Error fetching student courses:", error);
    throw error;
  }
};

// ============================================================
// 3. CHECK IF STUDENT HAS ACCESS TO COURSE
// ============================================================

export const checkCourseAccess = async (userId, courseId) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      status: "active"
    });
    
    if (!enrollment) {
      return {
        hasAccess: false,
        reason: "Not enrolled or enrollment inactive"
      };
    }
    
    // Check if access expired (if time-limited course)
    if (enrollment.accessEndDate && enrollment.accessEndDate < new Date()) {
      return {
        hasAccess: false,
        reason: "Access period expired"
      };
    }
    
    return {
      hasAccess: true,
      enrollmentId: enrollment._id,
      progressId: enrollment.progressId
    };
    
  } catch (error) {
    console.error("Error checking access:", error);
    throw error;
  }
};

// ============================================================
// 4. MIDDLEWARE: Require Course Access
// ============================================================

export const requireCourseAccessMiddleware = async (req, res, next) => {
  try {
    const { userId } = req.user; // From JWT
    const { courseId } = req.params;
    
    const access = await checkCourseAccess(userId, courseId);
    
    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Attach to request for use in next middleware
    req.enrollmentId = access.enrollmentId;
    req.progressId = access.progressId;
    
    next();
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking course access"
    });
  }
};

// ============================================================
// 5. GET COURSE DETAILS WITH ENROLLMENT COUNT
// ============================================================

export const getCourseDetails = async (courseId) => {
  try {
    const course = await Course.findById(courseId)
      .populate({
        path: "teacher",
        select: "name email teacherProfile.bio teacherProfile.avatar teacherProfile.rating"
      })
      .populate("subjects")
      .lean();
    
    if (!course) {
      throw new Error("Course not found");
    }
    
    // Optional: Verify enrollment count (reconciliation)
    const actualEnrollmentCount = await Enrollment.countDocuments({
      courseId,
      status: "active"
    });
    
    // Update if denormalized count is wrong
    if (course.enrollmentCount !== actualEnrollmentCount) {
      await Course.findByIdAndUpdate(courseId, {
        enrollmentCount: actualEnrollmentCount
      });
    }
    
    return {
      ...course,
      enrollmentCount: actualEnrollmentCount
    };
    
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
};

// ============================================================
// 6. GET ALL COURSES BY A TEACHER
// ============================================================

export const getTeacherCourses = async (teacherId, options = {}) => {
  try {
    const {
      status = "published",
      limit = 10,
      skip = 0
    } = options;
    
    const courses = await Course.find({
      teacher: teacherId,
      status
    })
      .select("title description price enrollmentCount rating thumbnail level createdAt")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
    
    return courses;
    
  } catch (error) {
    console.error("Error fetching teacher courses:", error);
    throw error;
  }
};

// ============================================================
// 7. PROCESS REFUND (Full Transaction)
// ============================================================

export const processRefund = async (enrollmentId, refundReason) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("courseId")
      .populate("paymentId");
    
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    
    // Check refund eligibility
    const daysSinceEnrollment = Math.floor(
      (new Date() - enrollment.enrollmentDate) / (1000 * 60 * 60 * 24)
    );
    
    const refundDays = enrollment.courseId.refundDays || 30;
    
    if (daysSinceEnrollment > refundDays) {
      throw new Error(`Refund period expired (${refundDays} days)`);
    }
    
    // Update payment
    if (enrollment.paymentId) {
      await Payment.findByIdAndUpdate(
        enrollment.paymentId._id,
        {
          status: "refunded",
          refundStatus: "processed",
          refundAmount: enrollment.paymentId.finalAmount,
          refundReason,
          refundDate: new Date()
          // Note: Call payment gateway API here to process refund
        },
        { session }
      );
    }
    
    // Update enrollment
    await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        status: "refunded"
      },
      { session }
    );
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(
      enrollment.courseId._id,
      { $inc: { enrollmentCount: -1 } },
      { session }
    );
    
    await session.commitTransaction();
    
    return {
      success: true,
      message: "Refund processed successfully",
      refundAmount: enrollment.paymentId.finalAmount
    };
    
  } catch (error) {
    await session.abortTransaction();
    console.error("Refund error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================================
// 8. UPDATE LECTURE COMPLETION & PROGRESS
// ============================================================

export const updateLectureCompletion = async (
  enrollmentId,
  lectureId,
  watchedDuration,
  totalDuration
) => {
  try {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    
    const courseProgress = await CourseProgress.findById(enrollment.progressId);
    if (!courseProgress) {
      throw new Error("Course progress not found");
    }
    
    // Find or create lecture progress
    let lectureProgressIdx = courseProgress.lectureProgress.findIndex(
      lp => lp.lectureId.toString() === lectureId
    );
    
    const percentageWatched = totalDuration ? (watchedDuration / totalDuration) * 100 : 0;
    const isCompleted = percentageWatched >= 90; // Mark complete if watched 90%
    
    if (lectureProgressIdx === -1) {
      // New lecture
      courseProgress.lectureProgress.push({
        lectureId,
        completed: isCompleted,
        videoWatchedDuration: watchedDuration,
        videoTotalDuration: totalDuration,
        lastAccessedDate: new Date(),
        completedDate: isCompleted ? new Date() : null
      });
    } else {
      // Update existing
      const lectureProgress = courseProgress.lectureProgress[lectureProgressIdx];
      lectureProgress.videoWatchedDuration = watchedDuration;
      lectureProgress.videoTotalDuration = totalDuration;
      lectureProgress.lastAccessedDate = new Date();
      
      if (isCompleted && !lectureProgress.completed) {
        lectureProgress.completed = true;
        lectureProgress.completedDate = new Date();
      }
    }
    
    // Recalculate overall progress
    const completedLectures = courseProgress.lectureProgress.filter(
      lp => lp.completed
    ).length;
    
    courseProgress.completionPercentage = Math.round(
      (completedLectures / courseProgress.totalLectures) * 100
    );
    courseProgress.lecturesCompleted = completedLectures;
    courseProgress.lastActivityDate = new Date();
    
    await courseProgress.save();
    
    // Sync to enrollment
    enrollment.completionPercentage = courseProgress.completionPercentage;
    enrollment.lastAccessedDate = new Date();
    await enrollment.save();
    
    // Check for completion (all lectures done)
    if (completedLectures === courseProgress.totalLectures) {
      enrollment.status = "completed";
      await enrollment.save();
    }
    
    return {
      lectureCompleted: isCompleted,
      progressPercentage: courseProgress.completionPercentage,
      lecturesCompleted: completedLectures,
      totalLectures: courseProgress.totalLectures
    };
    
  } catch (error) {
    console.error("Error updating progress:", error);
    throw error;
  }
};

// ============================================================
// 9. GET STUDENT DASHBOARD STATISTICS
// ============================================================

export const getStudentDashboard = async (userId) => {
  try {
    // Active enrollments count
    const activeEnrollments = await Enrollment.countDocuments({
      userId,
      status: "active"
    });
    
    // Completed courses
    const completedCourses = await Enrollment.countDocuments({
      userId,
      status: "completed"
    });
    
    // Certificates earned
    const certificatesEarned = await Certificate.countDocuments({
      userId
    });
    
    // Total learning hours
    const timeSpentData = await CourseProgress.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$totalTimeSpent" } } }
    ]);
    
    const totalLearningHours = Math.round((timeSpentData[0]?.total || 0) / 60);
    
    // Recent courses with progress
    const recentCourses = await Enrollment.find({
      userId,
      status: { $in: ["active", "completed"] }
    })
      .populate({
        path: "courseId",
        select: "title thumbnail teacher level"
      })
      .populate("progressId", "completionPercentage lecturesCompleted totalLectures")
      .limit(6)
      .sort({ lastAccessedDate: -1 });
    
    return {
      enrolledCourses: activeEnrollments,
      completedCourses,
      certificatesEarned,
      totalLearningHours,
      recentCourses
    };
    
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    throw error;
  }
};

// ============================================================
// 10. GET TEACHER ANALYTICS
// ============================================================

export const getTeacherAnalytics = async (teacherId) => {
  try {
    // Total courses published
    const totalCourses = await Course.countDocuments({
      teacher: teacherId,
      status: "published"
    });
    
    // Total unique students
    const studentIds = await Enrollment.distinct("userId", {
      courseId: {
        $in: await Course.find({ teacher: teacherId }).select("_id").lean()
      }
    });
    
    const totalStudents = studentIds.length;
    
    // Course-wise statistics
    const courseStats = await Enrollment.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": mongoose.Types.ObjectId(teacherId)
        }
      },
      {
        $group: {
          _id: "$courseId",
          courseName: { $first: "$course.title" },
          activeStudents: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          completedStudents: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          totalEnrollments: { $sum: 1 }
        }
      },
      { $sort: { totalEnrollments: -1 } },
      { $limit: 10 }
    ]);
    
    // Revenue statistics
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      {
        $lookup: {
          from: "enrollments",
          localField: "enrollmentId",
          foreignField: "_id",
          as: "enrollment"
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: "courses",
          localField: "enrollment.courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": mongoose.Types.ObjectId(teacherId)
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalPayments: { $sum: 1 }
        }
      }
    ]);
    
    return {
      totalCourses,
      totalStudents,
      monthlyRevenue: revenueData[0]?.totalRevenue || 0,
      courseStats,
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};

// ============================================================
// 11. GENERATE CERTIFICATE
// ============================================================

export const generateCertificate = async (enrollmentId) => {
  try {
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("userId")
      .populate("courseId")
      .populate("progressId");
    
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    
    // Check if course is completed
    if (enrollment.progressId.completionPercentage < 100) {
      throw new Error("Course not completed yet");
    }
    
    // Check if certificate already exists
    let certificate = await Certificate.findOne({ enrollmentId });
    
    if (!certificate) {
      // Generate unique certificate number
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create certificate
      certificate = await Certificate.create({
        enrollmentId,
        userId: enrollment.userId._id,
        courseId: enrollment.courseId._id,
        certificateNumber,
        studentName: enrollment.userId.name,
        courseName: enrollment.courseId.title,
        teacherName: "Teacher Name", // Fetch from teacher
        completionDate: new Date(),
        issueDate: new Date(),
        finalScore: enrollment.progressId.averageScore,
        isValid: true
      });
      
      // Update enrollment
      enrollment.certificateId = certificate._id;
      await enrollment.save();
    }
    
    return certificate;
    
  } catch (error) {
    console.error("Error generating certificate:", error);
    throw error;
  }
};

// ============================================================
// 12. DROP COURSE / UNENROLL
// ============================================================

export const dropCourse = async (enrollmentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const enrollment = await Enrollment.findById(enrollmentId).populate("courseId");
    
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    
    // Update enrollment
    const originalStatus = enrollment.status;
    enrollment.status = "dropped";
    await enrollment.save({ session });
    
    // Decrement enrollment count if it was active
    if (originalStatus === "active") {
      await Course.findByIdAndUpdate(
        enrollment.courseId._id,
        { $inc: { enrollmentCount: -1 } },
        { session }
      );
    }
    
    await session.commitTransaction();
    
    return {
      success: true,
      message: "Course dropped successfully"
    };
    
  } catch (error) {
    await session.abortTransaction();
    console.error("Drop course error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};
