import Course from "../models/Course.js";
import User from "../models/User.js";
import Material from "../models/Material.js";
import mongoose from "mongoose";

const normalizeFilePath = (value) => {
  if (!value) {
    return "";
  }

  return String(value).replace(/\\/g, "/");
};

const getFullImageUrl = (relativePath) => {
  if (!relativePath) {
    return "";
  }

  const normalized = normalizeFilePath(relativePath);
  
  // If already a full URL, return as is
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  // Otherwise, prepend backend URL
  const backendUrl = process.env.BACKEND_URL || "https://lmsproject1-cuzs.onrender.com";
  return `${backendUrl}/${normalized}`;
};

const parseMaybeJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const parseStringArray = (value) =>
  parseMaybeJsonArray(value)
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const parseUnits = (value, { includeIds = false } = {}) =>
  parseMaybeJsonArray(value)
    .map((unit) => {
      const lectures = Array.isArray(unit?.lectures)
        ? unit.lectures
            .map((lecture) => {
              const mappedLecture = {
                title: String(lecture?.title || "").trim(),
                videoUrl: normalizeFilePath(lecture?.videoUrl || lecture?.video || ""),
                duration: String(lecture?.duration || "").trim(),
                isPreview: Boolean(lecture?.isPreview),
              };

              if (includeIds && lecture?._id) {
                mappedLecture.id = String(lecture._id);
              }

              return mappedLecture;
            })
            .filter((lecture) => lecture.title)
        : [];

      const mappedUnit = {
        title: String(unit?.title || "").trim(),
        lectures,
      };

      if (includeIds && unit?._id) {
        mappedUnit.id = String(unit._id);
      }

      return mappedUnit;
    })
    .filter((unit) => unit.title);

const parseTestimonials = (value, { includeIds = false } = {}) =>
  parseMaybeJsonArray(value)
    .map((testimonial) => {
      const mappedTestimonial = {
        name: String(testimonial?.name || "").trim(),
        rating: Number(testimonial?.rating) || 0,
        comment: String(testimonial?.comment || "").trim(),
      };

      if (includeIds && testimonial?._id) {
        mappedTestimonial.id = String(testimonial._id);
      }

      return mappedTestimonial;
    })
    .filter((testimonial) => testimonial.name || testimonial.comment);

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
};

const toNumberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapTeacherForResponse = (teacher) => ({
  name: String(teacher?.name || "").trim(),
  photo: normalizeFilePath(
    teacher?.photo || teacher?.avatar || teacher?.teacherProfile?.avatar || ""
  ),
  experience: String(
    teacher?.experience ?? teacher?.teacherProfile?.experience ?? ""
  ).trim(),
  bio: String(teacher?.bio || teacher?.teacherProfile?.bio || "").trim(),
});

const mapCourseListResponse = (course) => {
  const teacherName = String(course?.teacher?.name || "").trim();

  return {
    ...course,
    thumbnail: getFullImageUrl(course?.thumbnail || ""),
    previewVideo: getFullImageUrl(course?.previewVideo || ""),
    instructor: teacherName,
    instructorName: teacherName,
    teacherName,
  };
};

const mapCourseDetailResponse = (course) => ({
  ...course,
  id: String(course?._id || ""),
  title: String(course?.title || "").trim(),
  subtitle: String(course?.subtitle || "").trim(),
  description: String(course?.description || "").trim(),
  price: toNumberOr(course?.price, 0),
  discountPrice:
    Number.isFinite(Number(course?.discountPrice)) && Number(course?.discountPrice) > 0
      ? Number(course.discountPrice)
      : null,
  thumbnail: getFullImageUrl(course?.thumbnail || ""),
  rating: toNumberOr(course?.rating, 0),
  enrollmentCount: toNumberOr(course?.enrollmentCount, 0),
  duration: String(course?.duration || "").trim(),
  level: String(course?.level || "").trim(),
  language: String(course?.language || "").trim(),
  certificateAvailable: Boolean(course?.certificateAvailable),
  refundDays: toNumberOr(course?.refundDays, 0),
  learningPoints: parseStringArray(course?.learningPoints),
  previewVideo: getFullImageUrl(course?.previewVideo || ""),
  features: parseStringArray(course?.features),
  units: parseUnits(course?.units, { includeIds: true }),
  testimonials: parseTestimonials(course?.testimonials, { includeIds: true }),
  instructor: String(course?.teacher?.name || "").trim(),
  instructorName: String(course?.teacher?.name || "").trim(),
  teacherName: String(course?.teacher?.name || "").trim(),
  teacher: mapTeacherForResponse(course?.teacher || {}),
});



/**
 * Create Course (Admin Only)
 */
export const createCourse = async (req, res) => {
  try {
    console.log("📥 Create course request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const {
      title,
      subtitle,
      description,
      price,
      discountPrice,
      duration,
      teacher,
      category,
      level,
      language,
      certificateAvailable,
      refundDays,
      rating,
      enrollmentCount,
      previewVideo,
      learningPoints,
      units,
      features,
      testimonials,
    } = req.body;

    const teacherFromBody = String(teacher || "").trim();
    const teacherFromToken = String(req?.user?._id || "").trim();
    const resolvedTeacherId = teacherFromBody || teacherFromToken;

    // Validate required fields
    if (!title || price === undefined || price === "") {
      console.error("❌ Missing required fields:", { title, description, price, teacher: resolvedTeacherId });
      return res.status(400).json({ 
        message: "Missing required fields: title, price",
        received: { title, description, price, teacher: resolvedTeacherId }
      });
    }

    if (!resolvedTeacherId) {
      return res.status(400).json({
        message: "Teacher is required. Please login again and retry.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resolvedTeacherId)) {
      return res.status(400).json({
        message: "Invalid teacher ID",
      });
    }

    const teacherExists = await User.findById(resolvedTeacherId).select("_id").lean();
    if (!teacherExists) {
      return res.status(404).json({
        message: "Teacher user not found",
      });
    }

    const thumbnail = normalizeFilePath(req.file?.path || req.body?.thumbnail || "");
    const normalizedPreviewVideo = normalizeFilePath(previewVideo || "");

    const parsedLearningPoints = parseStringArray(learningPoints);
    const parsedFeatures = parseStringArray(features);
    const parsedUnits = parseUnits(units);
    const parsedTestimonials = parseTestimonials(testimonials);
    const parsedDiscountPrice = Number(discountPrice);
    
    console.log("Creating course with data:", {
      title,
      subtitle,
      description,
      price,
      discountPrice,
      duration,
      teacher: resolvedTeacherId,
      category,
      thumbnail,
      previewVideo: normalizedPreviewVideo,
      learningPointsCount: parsedLearningPoints.length,
      unitsCount: parsedUnits.length,
    });

    const course = await Course.create({
      title,
      subtitle,
      description,
      price: Number(price),
      discountPrice:
        Number.isFinite(parsedDiscountPrice) && parsedDiscountPrice > 0
          ? parsedDiscountPrice
          : null,
      duration,
      teacher: resolvedTeacherId,
      category,
      level,
      language,
      rating: toNumberOr(rating, 0),
      enrollmentCount: Math.max(0, toNumberOr(enrollmentCount, 0)),
      certificateAvailable: toBoolean(certificateAvailable, true),
      refundDays: Math.max(0, toNumberOr(refundDays, 30)),
      previewVideo: normalizedPreviewVideo,
      learningPoints: parsedLearningPoints,
      features: parsedFeatures,
      units: parsedUnits,
      testimonials: parsedTestimonials,
      thumbnail,
    });

    const createdCourse = await Course.findById(course._id)
      .populate("teacher", "name photo experience bio teacherProfile")
      .lean();

    console.log("✅ Course created successfully:", course._id);
    res.status(201).json(mapCourseDetailResponse(createdCourse || course));
  } catch (error) {
    console.error("❌ Create course error:", error);
    res.status(500).json({ message: error.message || "Error creating course", error: error.toString() });
  }
};

/**
 * Get All Courses (Public)
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "_id name email phone avatar photo")
      .sort({ createdAt: -1 })
      .lean();

    const normalizedCourses = courses.map(mapCourseListResponse);

    res.json(normalizedCourses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};

/**
 * Get Single Course
 */
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(id)
      .populate("teacher", "name photo experience bio teacherProfile")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(mapCourseDetailResponse(course));
  } catch (error) {
    res.status(500).json({ message: "Error fetching course", error: error.message });
  }
};

/**
 * Update Course (Admin Only)
 */
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const {
      title,
      subtitle,
      description,
      price,
      discountPrice,
      duration,
      teacher,
      category,
      level,
      language,
      certificateAvailable,
      refundDays,
      rating,
      enrollmentCount,
      previewVideo,
      learningPoints,
      units,
      features,
      testimonials,
    } = req.body;

    if (title !== undefined) course.title = title;
    if (subtitle !== undefined) course.subtitle = subtitle;
    if (description !== undefined) course.description = description;
    if (price !== undefined && price !== "") course.price = Number(price);
    if (duration !== undefined) course.duration = duration;
    if (teacher !== undefined && teacher !== "") course.teacher = teacher;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (language !== undefined) course.language = language;

    if (discountPrice !== undefined) {
      const parsedDiscountPrice = Number(discountPrice);
      course.discountPrice =
        Number.isFinite(parsedDiscountPrice) && parsedDiscountPrice > 0
          ? parsedDiscountPrice
          : null;
    }

    if (rating !== undefined) {
      course.rating = Math.max(0, Math.min(5, toNumberOr(rating, course.rating || 0)));
    }

    if (enrollmentCount !== undefined) {
      course.enrollmentCount = Math.max(0, toNumberOr(enrollmentCount, course.enrollmentCount || 0));
    }

    if (certificateAvailable !== undefined) {
      course.certificateAvailable = toBoolean(certificateAvailable, course.certificateAvailable);
    }

    if (refundDays !== undefined) {
      course.refundDays = Math.max(0, toNumberOr(refundDays, course.refundDays || 30));
    }

    if (previewVideo !== undefined) {
      course.previewVideo = normalizeFilePath(previewVideo || "");
    }

    if (learningPoints !== undefined) {
      course.learningPoints = parseStringArray(learningPoints);
    }

    if (features !== undefined) {
      course.features = parseStringArray(features);
    }

    if (units !== undefined) {
      course.units = parseUnits(units);
    }

    if (testimonials !== undefined) {
      course.testimonials = parseTestimonials(testimonials);
    }
    
    if (req.file) {
      course.thumbnail = normalizeFilePath(req.file.path);
    }

    const updatedCourseDoc = await course.save();
    const updatedCourse = await Course.findById(updatedCourseDoc._id)
      .populate("teacher", "name photo experience bio teacherProfile")
      .lean();

    res.json(mapCourseDetailResponse(updatedCourse || updatedCourseDoc));
  } catch (error) {
    res.status(500).json({ message: "Error updating course", error: error.message });
  }
};

/**
 * Delete Course (Admin Only)
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.deleteOne();

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course" });
  }
};
  

// ✅ Enroll in Course (Student)
export const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findById(req.user._id);

    // ❌ Prevent duplicate enrollment
    if (user.purchasedCourses.includes(course._id)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    // ✅ Add course to user
    user.purchasedCourses.push(course._id);
    await user.save();

    // ✅ Update course enrollment counter
    course.enrollmentCount = Math.max(0, toNumberOr(course.enrollmentCount, 0) + 1);
    await course.save();

    res.json({ message: "Enrollment successful" });

  } catch (error) {
    res.status(500).json({ message: "Enrollment failed" });
  }
};





export const getCourseBuilder = async (req, res) => {

  try {

    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate("teacher", "name photo experience bio teacherProfile")
      .populate({
        path: "subjects",
        populate: {
          path: "units",
          populate: {
            path: "lectures"
          }
        }
      });

    res.json(course);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

/**
 * Get Course Player Data (Complete Tree with Materials)
 * GET /api/courses/player/:courseId
 * 
 * Returns: Course → Subjects → Units → Lectures → Materials
 * Fetches materials by lectureId and attaches to each lecture
 */
export const getCoursePlayer = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log("📥 Fetching course player data for:", courseId);

    // Fetch course with subjects, units, and lectures
    const course = await Course.findById(courseId)
      .populate("teacher", "name photo experience bio teacherProfile")
      .populate({
        path: "subjects",
        populate: {
          path: "units",
          populate: {
            path: "lectures"
          }
        }
      })
      .lean(); // Use lean for better performance

    if (!course) {
      console.log("❌ Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("✅ Course fetched, now fetching materials for lectures...");

    // Collect all lecture IDs
    const lectureIds = [];
    course.subjects?.forEach((subject) => {
      subject.units?.forEach((unit) => {
        unit.lectures?.forEach((lecture) => {
          lectureIds.push(lecture._id);
        });
      });
    });

    console.log("📚 Found lectures:", lectureIds.length);

    // Fetch all materials for these lectures
    const materials = await Material.find({
      lectureId: { $in: lectureIds }
    });

    console.log("📄 Found materials:", materials.length);

    // Create a map of lectureId -> materials array
    const materialsByLectureId = {};
    materials.forEach((material) => {
      if (!materialsByLectureId[material.lectureId]) {
        materialsByLectureId[material.lectureId] = [];
      }
      materialsByLectureId[material.lectureId].push(material);
    });

    // Attach materials to lectures
    course.subjects?.forEach((subject) => {
      subject.units?.forEach((unit) => {
        unit.lectures?.forEach((lecture) => {
          lecture.materials = materialsByLectureId[lecture._id] || [];
        });
      });
    });

    console.log("✅ Materials attached to lectures");
    res.json(course);
  } catch (error) {
    console.error("❌ Error fetching course player data:", error);
    res.status(500).json({ error: error.message || "Error fetching course player data" });
  }
};