import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseHero from "../components/courseDetail/CourseHero";
import CourseLearnSection from "../components/courseDetail/CourseLearnSection";
import CourseContentAccordion from "../components/courseDetail/CourseContentAccordion";
import InstructorSection from "../components/courseDetail/InstructorSection";
import CourseTestimonialsSection from "../components/courseDetail/CourseTestimonialsSection";
import CourseCTASection from "../components/courseDetail/CourseCTASection";
import API from "../utils/api";
import "../styles/CourseDetailPage.css";

const toArray = (value) => (Array.isArray(value) ? value : []);
const API_ORIGIN = "http://localhost:5000";
const MONGODB_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatPrice = (value) => {
  const numericValue = toNumber(value, 0);
  if (numericValue <= 0) {
    return "Free";
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
};

const resolveMediaUrl = (path) => {
  if (!path) {
    return "";
  }

  const normalized = String(path).replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `${API_ORIGIN}/${normalized}`;
};

const normalizeLecture = (lecture) => ({
  id: lecture?._id || lecture?.id || lecture?.title || Math.random().toString(36).slice(2),
  title: String(lecture?.title || "Lecture"),
  duration: String(lecture?.duration || lecture?.length || "N/A"),
  videoUrl: resolveMediaUrl(lecture?.videoUrl || lecture?.video || ""),
  isPreview: Boolean(lecture?.isPreview),
});

const isLikelyObjectId = (value) => MONGODB_OBJECT_ID_REGEX.test(String(value || "").trim());

const buildSubjectLookup = (subjects) => {
  const lookup = new Map();

  toArray(subjects).forEach((subject, subjectIndex) => {
    const subjectId = String(subject?._id || subject?.id || `subject-${subjectIndex}`);
    const subjectTitle = String(subject?.title || subject?.name || `Subject ${subjectIndex + 1}`).trim();

    if (subjectId) {
      lookup.set(subjectId, subjectTitle);
    }

    toArray(subject?.units).forEach((unit) => {
      const unitId = String(unit?._id || unit?.id || "");
      if (unitId) {
        lookup.set(unitId, subjectTitle);
      }
    });
  });

  return lookup;
};

const withSubjectInTitle = (title, subject) => {
  const normalizedTitle = String(title || "").trim();
  const normalizedSubject = String(subject || "").trim();

  if (!normalizedSubject) {
    return normalizedTitle;
  }

  if (
    normalizedTitle.toLowerCase().startsWith(`${normalizedSubject.toLowerCase()} >`) ||
    normalizedTitle.toLowerCase().startsWith(`${normalizedSubject.toLowerCase()} -`)
  ) {
    return normalizedTitle;
  }

  return normalizedTitle ? `${normalizedSubject} > ${normalizedTitle}` : normalizedSubject;
};

const normalizeUnits = (course) => {
  const subjectLookup = buildSubjectLookup(course?.subjects);

  const unitsFromCourse = toArray(course?.units)
    .map((unit, unitIndex) => ({
      id: unit?._id || unit?.id || `${unit?.title || "unit"}-${unitIndex}`,
      subject:
        String(
          unit?.subject?.title ||
            unit?.subject?.name ||
            subjectLookup.get(String(unit?.subjectId || unit?._id || unit?.id || "")) ||
            ""
        ).trim(),
      title: String(unit?.title || `Unit ${unitIndex + 1}`),
      lectures: toArray(unit?.lectures).map(normalizeLecture),
    }))
    .map((unit) => ({
      ...unit,
      title: withSubjectInTitle(unit.title, unit.subject),
    }))
    .filter((unit) => unit.title.trim());

  if (unitsFromCourse.length > 0) {
    return unitsFromCourse;
  }

  const modules = toArray(course?.modules)
    .map((module, moduleIndex) => ({
      id: module?._id || module?.id || `${module?.title || "module"}-${moduleIndex}`,
      subject:
        String(
          module?.subject?.title ||
            module?.subject?.name ||
            subjectLookup.get(String(module?.subjectId || module?._id || module?.id || "")) ||
            ""
        ).trim(),
      title: String(module?.title || `Module ${moduleIndex + 1}`),
      lectures: toArray(module?.lectures).map(normalizeLecture),
    }))
    .map((module) => ({
      ...module,
      title: withSubjectInTitle(module.title, module.subject),
    }))
    .filter((module) => module.title.trim());

  if (modules.length > 0) {
    return modules;
  }

  const subjects = toArray(course?.subjects);
  const subjectUnits = subjects
    .flatMap((subject, subjectIndex) => {
      const units = toArray(subject?.units);

      if (units.length > 0) {
        const subjectTitle = String(subject?.title || subject?.name || `Subject ${subjectIndex + 1}`).trim();

        return units.map((unit, unitIndex) => ({
          id: unit?._id || unit?.id || `${subject?._id || subjectIndex}-unit-${unitIndex}`,
          subject: subjectTitle,
          title: withSubjectInTitle(
            String(unit?.title || unit?.name || `Unit ${unitIndex + 1}`),
            subjectTitle
          ),
          lectures: toArray(unit?.lectures).map(normalizeLecture),
        }));
      }

      const subjectTitle = String(subject?.title || subject?.name || `Subject ${subjectIndex + 1}`).trim();

      return [
        {
          id: subject?._id || subject?.id || `subject-${subjectIndex}`,
          subject: subjectTitle,
          title: subjectTitle || `Module ${subjectIndex + 1}`,
          lectures: toArray(subject?.lectures).map(normalizeLecture),
        },
      ];
    })
    .filter((module) => module.title.trim());

  return subjectUnits;
};

const normalizeCourse = (rawCourse) => {
  const instructorValue = rawCourse?.instructor ?? rawCourse?.teacher;
  const instructorObject = typeof instructorValue === "object" && instructorValue !== null ? instructorValue : {};
  const instructorString = typeof instructorValue === "string" ? instructorValue.trim() : "";

  const instructorName =
    instructorObject?.name ||
    rawCourse?.instructorName ||
    rawCourse?.teacherName ||
    (instructorString && !isLikelyObjectId(instructorString) ? instructorString : "") ||
    "Expert Mentor";

  const normalizedRating = Math.max(0, Math.min(5, toNumber(rawCourse?.rating, 0)));

  const enrollmentCount = Math.max(
    0,
    toNumber(
      rawCourse?.enrollmentCount ??
        rawCourse?.totalStudents ??
        rawCourse?.studentsCount ??
        rawCourse?.studentsEnrolled?.length,
      0
    )
  );

  const basePrice = Math.max(0, toNumber(rawCourse?.price, 0));
  const parsedDiscountPrice = Math.max(0, toNumber(rawCourse?.discountPrice, 0));
  const hasDiscount = parsedDiscountPrice > 0 && parsedDiscountPrice < basePrice;
  const finalPrice = hasDiscount ? parsedDiscountPrice : basePrice;

  const priceLabel = formatPrice(finalPrice);

  const testimonials = toArray(rawCourse?.testimonials)
    .map((testimonial, index) => {
      const testimonialRating = Math.max(0, Math.min(5, toNumber(testimonial?.rating, 0)));

      return {
        id: testimonial?.id || testimonial?._id || `${testimonial?.name || "testimonial"}-${index}`,
        name: String(testimonial?.name || "Learner"),
        comment: String(testimonial?.comment || testimonial?.text || "").trim(),
        rating: testimonialRating,
        ratingLabel: testimonialRating > 0 ? `${testimonialRating.toFixed(1)}/5` : "",
      };
    })
    .filter((testimonial) => testimonial.comment);

  const subjects = toArray(rawCourse?.subjects)
    .map((subject, index) => ({
      id: subject?._id || subject?.id || `subject-${index}`,
      title: String(subject?.title || subject?.name || `Subject ${index + 1}`).trim(),
    }))
    .filter((subject) => subject.title);

  return {
    id: rawCourse?._id || rawCourse?.id || "",
    title: String(rawCourse?.title || "Course"),
    subtitle: String(rawCourse?.subtitle || "").trim(),
    description: String(rawCourse?.description || "").trim(),
    price: basePrice,
    discountPrice: hasDiscount ? parsedDiscountPrice : null,
    finalPrice,
    priceLabel,
    rating: normalizedRating,
    ratingLabel: normalizedRating > 0 ? `${normalizedRating.toFixed(1)}/5` : "",
    enrollmentCount,
    studentsLabel: enrollmentCount > 0 ? `${enrollmentCount.toLocaleString("en-IN")} students` : "",
    thumbnail: resolveMediaUrl(rawCourse?.thumbnail || rawCourse?.banner),
    previewVideo: resolveMediaUrl(rawCourse?.previewVideo),
    category: String(rawCourse?.category || "").trim(),
    duration: String(rawCourse?.duration || "").trim(),
    level: String(rawCourse?.level || "").trim(),
    language: String(rawCourse?.language || "").trim(),
    certificateAvailable: Boolean(rawCourse?.certificateAvailable),
    refundDays: Math.max(0, toNumber(rawCourse?.refundDays, 0)),
    features: toArray(rawCourse?.features).map((feature) => String(feature || "").trim()).filter(Boolean),
    learningPoints: toArray(rawCourse?.learningPoints)
      .map((point) => String(point || "").trim())
      .filter(Boolean),
    subjects,
    units: normalizeUnits(rawCourse),
    testimonials,
    instructor: {
      name: instructorName,
      photo: resolveMediaUrl(instructorObject?.photo || rawCourse?.instructorPhoto || rawCourse?.teacherPhoto),
      experience: String(instructorObject?.experience || rawCourse?.instructorExperience || "").trim(),
      bio: String(instructorObject?.bio || rawCourse?.instructorBio || "").trim(),
    },
  };
};

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourse = useCallback(async () => {
    if (!id) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      // Use the same course-detail endpoint used by CoursePlayer to keep hierarchy in sync.
      const response = await API.get(`/courses/player/${id}`);
      const responseData = response?.data;
      const backendCourse =
        responseData?.data && typeof responseData.data === "object"
          ? responseData.data
          : responseData?.course && typeof responseData.course === "object"
            ? responseData.course
            : responseData;
      const parsedCourse = normalizeCourse(backendCourse || {});

      // Player route is best for curriculum but can miss populated teacher details.
      if (!parsedCourse?.instructor?.name || parsedCourse.instructor.name === "Expert Mentor") {
        try {
          const fallbackResponse = await API.get(`/courses/${id}`);
          const fallbackData = fallbackResponse?.data;
          const fallbackCourseRaw =
            fallbackData?.data && typeof fallbackData.data === "object"
              ? fallbackData.data
              : fallbackData?.course && typeof fallbackData.course === "object"
                ? fallbackData.course
                : fallbackData;

          const fallbackCourse = normalizeCourse(fallbackCourseRaw || {});

          setCourse({
            ...parsedCourse,
            instructor: {
              ...parsedCourse.instructor,
              ...fallbackCourse.instructor,
            },
          });
          return;
        } catch (instructorFallbackError) {
          console.warn("Instructor fallback fetch failed:", instructorFallbackError);
        }
      }

      setCourse(parsedCourse);
    } catch (fetchError) {
      console.error("Error fetching course details:", fetchError);
      setError("Could not load this course right now.");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const checkoutPayload = useMemo(() => {
    if (!course) {
      return null;
    }

    return {
      _id: course.id,
      name: course.title,
      image: course.thumbnail,
      description: course.description,
      instructor: course.instructor.name,
      category: course.category,
      price: course.finalPrice,
      discountPrice: course.discountPrice,
      duration: course.duration,
      enrollmentCount: course.enrollmentCount,

    };
  }, [course]);

  const handleEnroll = () => {
    if (!course || !checkoutPayload) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { state: { redirectTo: `/courses/${course.id}` } });
      return;
    }

    navigate("/checkout", {
      state: { course: checkoutPayload },
    });
  };

  if (loading) {
    return (
      <section className="course-detail-page">
        <div className="course-detail-container">
          <div className="cd-skeleton cd-skeleton-hero" />
          <div className="cd-skeleton cd-skeleton-block" />
          <div className="cd-skeleton cd-skeleton-block" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-detail-page">
        <div className="course-detail-container">
          <div className="cd-error-box">
            <h2>Unable to Load Course</h2>
            <p>{error}</p>
            <button type="button" className="cd-btn cd-btn-primary" onClick={fetchCourse}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="course-detail-page">
        <div className="course-detail-container">
          <div className="cd-error-box">
            <h2>Course Not Found</h2>
            <p>This course is not available right now.</p>
            <button type="button" className="cd-btn cd-btn-primary" onClick={() => navigate("/courses")}>Go To Courses</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="course-detail-page">
      <div className="course-detail-container">
        <CourseHero course={course} onEnroll={handleEnroll} />

        <div className="cd-main-grid">
          <CourseLearnSection learningPoints={course.learningPoints} features={course.features} />
          <CourseContentAccordion units={course.units} />
        </div>

        <InstructorSection instructor={course.instructor} />
        <CourseTestimonialsSection testimonials={course.testimonials} />
        <CourseCTASection
          priceLabel={course.priceLabel}
          originalPriceLabel={course.discountPrice ? formatPrice(course.price) : ""}
          onEnroll={handleEnroll}
        />
      </div>
    </section>
  );
}

export default CourseDetailPage;
