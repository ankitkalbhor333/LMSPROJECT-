import mongoose from "mongoose";
import LiveClass from "../models/LiveClass.js";
import LiveClassAttendance from "../models/LiveClassAttendance.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { buildRoomName, createLiveKitToken } from "../services/livekitService.js";

const isTeacher = (user) => user && user.role === "teacher";
const isAdmin = (user) => user && user.role === "admin";

const getClassAccess = async (user, liveClass) => {
  if (!liveClass) {
    return { allowed: false, reason: "Live class not found" };
  }

  // Admin and the class teacher always have access
  if (isAdmin(user) || String(liveClass.teacherId) === String(user._id)) {
    return { allowed: true, kind: "teacher" };
  }

  // Any teacher can join/view live classes (they manage their classes)
  if (isTeacher(user)) {
    return { allowed: true, kind: "teacher" };
  }

  // Students must be enrolled in the course
  const enrollment = await Enrollment.findOne({
    userId: user._id,
    courseId: liveClass.courseId,
    status: "active",
  });

  if (enrollment) {
    return { allowed: true, kind: "student" };
  }

  return { allowed: false, reason: "Not enrolled in this course" };
};

const getPublicClassShape = (liveClass) => ({
  _id: liveClass._id,
  courseId: liveClass.courseId,
  teacherId: liveClass.teacherId,
  title: liveClass.title,
  description: liveClass.description,
  scheduledAt: liveClass.scheduledAt,
  duration: liveClass.duration,
  roomName: liveClass.roomName,
  status: liveClass.status,
  startedAt: liveClass.startedAt,
  endedAt: liveClass.endedAt,
  recording: liveClass.recording,
  createdAt: liveClass.createdAt,
  updatedAt: liveClass.updatedAt,
});

export const getLiveClasses = async (req, res) => {
  try {
    let query = {};

    if (isTeacher(req.user) && !isAdmin(req.user)) {
      query.teacherId = req.user._id;
    }

    const liveClasses = await LiveClass.find(query)
      .populate("courseId", "title teacher")
      .populate("teacherId", "name email role")
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      count: liveClasses.length,
      data: liveClasses.map(getPublicClassShape),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching live classes",
      error: error.message,
    });
  }
};

export const getUpcomingLiveClasses = async (req, res) => {
  try {
    let query = {
      status: { $in: ["scheduled", "live"] },
      scheduledAt: { $gte: new Date() },
    };

    if (isTeacher(req.user) && !isAdmin(req.user)) {
      query.teacherId = req.user._id;
    } else if (!isAdmin(req.user)) {
      const enrollments = await Enrollment.find({
        userId: req.user._id,
        status: "active",
      }).select("courseId");

      const courseIds = enrollments.map((entry) => entry.courseId);
      query.courseId = { $in: courseIds };
    }

    const liveClasses = await LiveClass.find(query)
      .populate("courseId", "title thumbnail teacher")
      .populate("teacherId", "name avatar")
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      count: liveClasses.length,
      data: liveClasses.map(getPublicClassShape),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching upcoming live classes",
      error: error.message,
    });
  }
};

export const getLiveClassById = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate("courseId", "title teacher")
      .populate("teacherId", "name email role");

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    res.json({
      success: true,
      data: getPublicClassShape(liveClass),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching live class",
      error: error.message,
    });
  }
};

export const createLiveClass = async (req, res) => {
  try {
    const user = req.user;
    const {
      courseId,
      title,
      description,
      scheduledAt,
      duration,
      roomName,
      teacherId,
    } = req.body;

    if (!courseId || !title || !scheduledAt || !duration) {
      return res.status(422).json({
        success: false,
        message: "Course, title, scheduledAt, and duration are required",
      });
    }

    if (!isTeacher(user) && !isAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: "Only teachers and admins can create live classes",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const resolvedTeacherId = teacherId || user._id;

    const teacher = await User.findById(resolvedTeacherId);
    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) {
      return res.status(403).json({
        success: false,
        message: "Invalid teacher for live class",
      });
    }

    const generatedRoomName = roomName || buildRoomName({
      courseId,
      title,
      id: `${Date.now()}`,
    });

    const liveClass = await LiveClass.create({
      courseId,
      teacherId: resolvedTeacherId,
      title,
      description: description || "",
      scheduledAt: new Date(scheduledAt),
      duration: Number(duration),
      roomName: generatedRoomName,
      status: "scheduled",
    });

    res.status(201).json({
      success: true,
      data: getPublicClassShape(liveClass),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A live class room with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating live class",
      error: error.message,
    });
  }
};

export const updateLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!isAdmin(req.user) && String(liveClass.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this class",
      });
    }

    const { title, description, scheduledAt, duration, status } = req.body;

    if (title) liveClass.title = title;
    if (description !== undefined) liveClass.description = description;
    if (scheduledAt) liveClass.scheduledAt = new Date(scheduledAt);
    if (duration) liveClass.duration = Number(duration);
    if (status) liveClass.status = status;

    await liveClass.save();

    res.json({
      success: true,
      data: getPublicClassShape(liveClass),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating live class",
      error: error.message,
    });
  }
};

export const deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!isAdmin(req.user) && String(liveClass.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this class",
      });
    }

    await LiveClassAttendance.deleteMany({ liveClassId: liveClass._id });
    await liveClass.deleteOne();

    res.json({
      success: true,
      message: "Live class deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting live class",
      error: error.message,
    });
  }
};

export const startLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!isAdmin(req.user) && String(liveClass.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to start this class",
      });
    }

    if (liveClass.status === "ended" || liveClass.status === "cancelled") {
      return res.status(409).json({
        success: false,
        message: "This class cannot be started in its current state",
      });
    }

    liveClass.status = "live";
    liveClass.startedAt = liveClass.startedAt || new Date();
    await liveClass.save();

    res.json({
      success: true,
      data: getPublicClassShape(liveClass),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting live class",
      error: error.message,
    });
  }
};

export const endLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!isAdmin(req.user) && String(liveClass.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to end this class",
      });
    }

    liveClass.status = "ended";
    liveClass.endedAt = new Date();
    await liveClass.save();

    res.json({
      success: true,
      data: getPublicClassShape(liveClass),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error ending live class",
      error: error.message,
    });
  }
};

export const getLiveClassAttendance = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    if (access.kind === "student") {
      const record = await LiveClassAttendance.findOne({
        liveClassId: liveClass._id,
        studentId: req.user._id,
      }).populate("studentId", "name email");

      return res.json({
        success: true,
        data: record || null,
      });
    }

    const records = await LiveClassAttendance.find({ liveClassId: liveClass._id })
      .populate("studentId", "name email")
      .sort({ joinedAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message,
    });
  }
};

export const getLiveClassRecording = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    res.json({
      success: true,
      data: {
        enabled: liveClass.recording?.enabled || false,
        status: liveClass.recording?.status || "not_started",
        url: liveClass.recording?.url || "",
        duration: liveClass.recording?.duration || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recording metadata",
      error: error.message,
    });
  }
};

export const getLiveClassAttendanceSummary = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    const records = await LiveClassAttendance.find({ liveClassId: liveClass._id });

    const summary = {
      totalStudents: records.length,
      present: records.filter((record) => record.status === "present").length,
      late: records.filter((record) => record.status === "late").length,
      absent: records.filter((record) => record.status === "absent").length,
      excused: records.filter((record) => record.status === "excused").length,
      inProgress: records.filter((record) => record.status === "in_progress").length,
      averageDurationMinutes: records.length
        ? Math.round(
            records.reduce((total, record) => total + Number(record.duration || 0), 0) /
              records.length
          )
        : 0,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance summary",
      error: error.message,
    });
  }
};

export const toggleLiveClassRecording = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!isAdmin(req.user) && String(liveClass.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update recording metadata",
      });
    }

    const { enabled, status, url, duration } = req.body || {};
    const nextEnabled = typeof enabled === "boolean" ? enabled : Boolean(liveClass.recording?.enabled);

    liveClass.recording = {
      ...liveClass.recording?.toObject?.() ,
      enabled: nextEnabled,
      status: status || (nextEnabled ? "recording" : "disabled"),
      url: url || liveClass.recording?.url || "",
      duration: Number(duration ?? liveClass.recording?.duration ?? 0),
    };

    await liveClass.save();

    res.json({
      success: true,
      data: {
        enabled: liveClass.recording.enabled,
        status: liveClass.recording.status,
        url: liveClass.recording.url,
        duration: liveClass.recording.duration,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating recording metadata",
      error: error.message,
    });
  }
};

export const getClassJoinToken = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    if (!liveClass.roomName) {
      return res.status(422).json({
        success: false,
        message: "No room has been assigned to this class",
      });
    }

    const isHost = isAdmin(req.user) || String(liveClass.teacherId) === String(req.user._id) || isTeacher(req.user);

    let tokenPayload;
    try {
      tokenPayload = await createLiveKitToken({
        identity: String(req.user._id),
        roomName: liveClass.roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
    } catch (tokenError) {
      return res.status(500).json({
        success: false,
        message: "Error generating LiveKit token",
        error: tokenError.message,
        debug: {
          apiKeySet: !!process.env.LIVEKIT_API_KEY,
          apiSecretSet: !!process.env.LIVEKIT_API_SECRET,
          url: process.env.LIVEKIT_URL,
        },
      });
    }

    res.json({
      success: true,
      data: tokenPayload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating room token",
      error: error.message,
    });
  }
};

export const joinLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    if (liveClass.status === "cancelled" || liveClass.status === "ended") {
      return res.status(409).json({
        success: false,
        message: "This live class is no longer active",
      });
    }

    const now = new Date();
    let attendance = await LiveClassAttendance.findOne({
      liveClassId: liveClass._id,
      studentId: req.user._id,
    });

    if (!attendance) {
      attendance = await LiveClassAttendance.create({
        liveClassId: liveClass._id,
        studentId: req.user._id,
        enrollmentId: (await Enrollment.findOne({
          userId: req.user._id,
          courseId: liveClass.courseId,
          status: "active",
        }).select("_id"))?._id || null,
        courseId: liveClass.courseId,
        joinedAt: now,
        status: "in_progress",
      });
    } else if (!attendance.leftAt && attendance.status === "in_progress") {
      attendance.joinedAt = attendance.joinedAt || now;
      attendance.status = "in_progress";
      await attendance.save();
    } else {
      attendance.joinedAt = now;
      attendance.leftAt = null;
      attendance.status = "in_progress";
      await attendance.save();
    }

    res.json({
      success: true,
      message: "Joined live class successfully",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error joining live class",
      error: error.message,
    });
  }
};

export const leaveLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const access = await getClassAccess(req.user, liveClass);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason,
      });
    }

    const attendance = await LiveClassAttendance.findOne({
      liveClassId: liveClass._id,
      studentId: req.user._id,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for this student",
      });
    }

    const leftAt = new Date();
    const joinedAt = attendance.joinedAt || leftAt;
    const durationMs = Math.max(0, leftAt.getTime() - new Date(joinedAt).getTime());

    attendance.leftAt = leftAt;
    attendance.duration = Math.round(durationMs / 60000);
    attendance.status = "present";
    await attendance.save();

    res.json({
      success: true,
      message: "Left live class successfully",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error leaving live class",
      error: error.message,
    });
  }
};
