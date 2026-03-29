import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import CourseProgress from "../models/CourseProgress.js";

/**
 * Get all courses enrolled by current user
 * @route GET /api/enrollment/my-courses
 * @param {string} status - Optional filter (active, completed, refunded)
 */
export const getMyEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "active" } = req.query;

    console.log("📚 Fetching enrolled courses for user:", userId);

    let query = { userId: userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: "courseId",
        select: "_id title description thumbnail price duration category teacher enrollmentCount",
        populate: {
          path: "teacher",
          select: "_id name email teacherProfile"
        }
      })
      .sort({ enrollmentDate: -1 });

    console.log(`✅ Found ${enrollments.length} enrolled courses`);

    res.json(enrollments);
  } catch (error) {
    console.error("❌ Error fetching enrolled courses:", error);
    res.status(500).json({
      message: "Error fetching enrolled courses",
      error: error.message
    });
  }
};

/**
 * Get all enrollments for current user (any status)
 * @route GET /api/enrollment/my-enrollments
 */
export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("📋 Fetching all enrollments for user:", userId);

    const enrollments = await Enrollment.find({ userId: userId })
      .populate({
        path: "courseId",
        select: "_id title thumbnail price duration",
        populate: {
          path: "teacher",
          select: "_id name"
        }
      })
      .sort({ enrollmentDate: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("❌ Error fetching enrollments:", error);
    res.status(500).json({
      message: "Error fetching enrollments",
      error: error.message
    });
  }
};

/**
 * Check if user has access to a course
 * @route GET /api/enrollment/check-access/:courseId
 */
export const checkCourseAccess = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    console.log("🔍 Checking access for course:", courseId);

    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId,
      status: "active"
    });

    if (!enrollment) {
      return res.json({
        hasAccess: false,
        reason: "Not enrolled in this course"
      });
    }

    // Check if course progress exists
    const progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    res.json({
      hasAccess: true,
      enrollmentId: enrollment._id,
      progressId: progress?._id
    });
  } catch (error) {
    console.error("❌ Error checking access:", error);
    res.status(500).json({
      message: "Error checking course access",
      hasAccess: false
    });
  }
};

/**
 * Get enrollment details for a specific course
 * @route GET /api/enrollment/:courseId
 */
export const getEnrollmentDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    console.log("📖 Fetching enrollment details for course:", courseId);

    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId
    })
      .populate("courseId")
      .populate("userId", "_id name email studentProfile");

    if (!enrollment) {
      return res.status(404).json({
        message: "Enrollment not found"
      });
    }

    res.json(enrollment);
  } catch (error) {
    console.error("❌ Error fetching enrollment details:", error);
    res.status(500).json({
      message: "Error fetching enrollment details",
      error: error.message
    });
  }
};

/**
 * Get course progress for current user
 * @route GET /api/enrollment/progress/:courseId
 */
export const getCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    console.log("⏳ Fetching progress for course:", courseId);

    const progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    if (!progress) {
      return res.json({
        completionPercentage: 0,
        videosWatched: 0,
        totalVideos: 0,
        lastWatchedAt: null
      });
    }

    res.json(progress);
  } catch (error) {
    console.error("❌ Error fetching progress:", error);
    res.status(500).json({
      message: "Error fetching course progress",
      error: error.message
    });
  }
};

/**
 * Get enrollments for a specific student (Admin only)
 * @route GET /api/enrollment/student/:userId
 */
export const getStudentEnrollments = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user._id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view other students' enrollments"
      });
    }

    const { userId } = req.params;

    console.log("👤 Fetching enrollments for student:", userId);

    const enrollments = await Enrollment.find({ userId: userId })
      .populate("courseId")
      .populate("userId", "_id name email studentProfile")
      .sort({ enrollmentDate: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("❌ Error fetching student enrollments:", error);
    res.status(500).json({
      message: "Error fetching student enrollments",
      error: error.message
    });
  }
};

/**
 * Get all enrollments (Admin only)
 * @route GET /api/enrollment/admin/all
 */
export const getAllEnrollments = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user._id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view all enrollments"
      });
    }

    const { courseId, status, limit = 50, skip = 0 } = req.query;

    console.log("📊 Fetching all enrollments");

    let query = {};
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate("courseId")
      .populate("userId", "_id name email studentProfile")
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ enrollmentDate: -1 });

    const total = await Enrollment.countDocuments(query);

    res.json({
      data: enrollments,
      total: total,
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error("❌ Error fetching all enrollments:", error);
    res.status(500).json({
      message: "Error fetching enrollments",
      error: error.message
    });
  }
};

/**
 * Get enrollment statistics (Admin only)
 * @route GET /api/enrollment/admin/stats
 */
export const getEnrollmentStats = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user._id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view enrollment statistics"
      });
    }

    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ status: "completed" });
    const refundedEnrollments = await Enrollment.countDocuments({ status: "refunded" });

    const enrollmentsByStatus = await Enrollment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalEnrollments,
      completedEnrollments,
      refundedEnrollments,
      enrollmentsByStatus
    });
  } catch (error) {
    console.error("❌ Error fetching enrollment stats:", error);
    res.status(500).json({
      message: "Error fetching enrollment statistics",
      error: error.message
    });
  }
};

/**
 * Mark a lecture as complete
 * @route POST /api/enrollment/progress/:courseId/complete-lecture
 * @body { lectureId: string }
 */
export const markLectureComplete = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const { lectureId } = req.body;

    console.log(`📝 Marking lecture ${lectureId} complete for user ${userId}`);

    // Get or create progress record
    let progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    if (!progress) {
      // Create new progress record
      progress = new CourseProgress({
        enrollmentId: null, // Will be set below
        userId: userId,
        courseId: courseId,
        completedLectures: [
          {
            lectureId: lectureId,
            completedAt: new Date()
          }
        ],
        lastWatchedLecture: lectureId,
        progressPercentage: 0
      });
    } else {
      // Check if lecture already marked complete
      const alreadyCompleted = progress.completedLectures.some(
        lec => lec.lectureId.toString() === lectureId
      );

      if (!alreadyCompleted) {
        progress.completedLectures.push({
          lectureId: lectureId,
          completedAt: new Date()
        });
      }
      progress.lastWatchedLecture = lectureId;
    }

    // Get enrollment to calculate total lectures
    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId
    });

    if (enrollment && !progress.enrollmentId) {
      progress.enrollmentId = enrollment._id;
    }

    // Get course to get total lecture count
    const course = await Course.findById(courseId).select('subjects');
    let totalLectures = 0;
    if (course && course.subjects) {
      course.subjects.forEach(subPath => {
        if (subPath.units) {
          subPath.units.forEach(unitPath => {
            if (unitPath.lectures) {
              totalLectures += unitPath.lectures.length;
            }
          });
        }
      });
    }

    // Calculate progress percentage
    if (totalLectures > 0) {
      progress.progressPercentage = Math.round(
        (progress.completedLectures.length / totalLectures) * 100
      );
    }

    await progress.save();

    // Update enrollment completion percentage
    if (enrollment) {
      enrollment.completionPercentage = progress.progressPercentage;
      enrollment.lastAccessedDate = new Date();
      await enrollment.save();
    }

    console.log(`✅ Lecture marked complete. Progress: ${progress.progressPercentage}%`);

    res.json({
      success: true,
      completedCount: progress.completedLectures.length,
      progressPercentage: progress.progressPercentage,
      lastWatchedLecture: progress.lastWatchedLecture
    });
  } catch (error) {
    console.error("❌ Error marking lecture complete:", error);
    res.status(500).json({
      message: "Error marking lecture complete",
      error: error.message
    });
  }
};

/**
 * Update lecture watch percentage (for auto-completion at 90%)
 * @route PATCH /api/enrollment/progress/:courseId/lecture-progress/:lectureId
 * @body { watchedPercentage: number }
 */
export const updateLectureProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, lectureId } = req.params;
    const { watchedPercentage } = req.body;

    console.log(`📊 Updating watch progress: ${watchedPercentage}% for lecture ${lectureId}`);

    // If watched more than 90%, auto-complete
    if (watchedPercentage >= 90) {
      console.log("✨ Auto-completing lecture at 90% watch threshold");
      return markLectureComplete(
        { user: req.user, params: { courseId }, body: { lectureId } },
        res
      );
    }

    // Otherwise just update last watched
    let progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    if (!progress) {
      progress = new CourseProgress({
        userId: userId,
        courseId: courseId,
        lastWatchedLecture: lectureId,
        completedLectures: []
      });
    } else {
      progress.lastWatchedLecture = lectureId;
    }

    await progress.save();

    res.json({
      success: true,
      watchedPercentage: watchedPercentage,
      lastWatchedLecture: progress.lastWatchedLecture
    });
  } catch (error) {
    console.error("❌ Error updating lecture progress:", error);
    res.status(500).json({
      message: "Error updating lecture progress",
      error: error.message
    });
  }
};

/**
 * Get all completed lectures for a course
 * @route GET /api/enrollment/progress/:courseId/completed
 */
export const getCompletedLectures = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    console.log(`📚 Fetching completed lectures for course ${courseId}`);

    const progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    if (!progress) {
      return res.json({
        completedLectures: [],
        lastWatchedLecture: null,
        progressPercentage: 0
      });
    }

    // Extract just the lecture IDs for easy comparison
    const completedLectureIds = progress.completedLectures.map(
      item => item.lectureId.toString()
    );

    res.json({
      completedLectures: completedLectureIds,
      completionDetails: progress.completedLectures,
      lastWatchedLecture: progress.lastWatchedLecture,
      progressPercentage: progress.progressPercentage
    });
  } catch (error) {
    console.error("❌ Error fetching completed lectures:", error);
    res.status(500).json({
      message: "Error fetching completed lectures",
      error: error.message
    });
  }
};
