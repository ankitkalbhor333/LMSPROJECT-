import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Star, Users } from "lucide-react";
import { useEnrollment } from "../../hooks/useEnrollment";
import { resolveInstructorName } from "../../utils/courseIdentity";
import "./CourseCard.css";

function CourseCard({
  image,
  name,
  description,
  instructor,
  category,
  price,
  duration,
  courseId,
  _id,
  rating = 4.8,
  studentsCount,
  language = "Hindi",
  mentorExperience = "8+ yrs",
  tags,
  popular = false,
  badgeType,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const navigate = useNavigate();
  const { hasAccessToCourse } = useEnrollment();
  const resolvedCourseId = courseId || _id;

  const parsedPrice = Number(price);
  const displayPrice = Number.isFinite(parsedPrice)
    ? `₹${parsedPrice.toLocaleString("en-IN")}`
    : price
      ? `₹${price}`
      : "Free";

  const displayInstructor = useMemo(
    () => resolveInstructorName(instructor, "Expert Faculty"),
    [instructor]
  );

  const displayRating = Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : "4.8";

  const displayStudents = useMemo(() => {
    const numeric = Number(studentsCount);
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("en-IN")}+`;
    }

    if (typeof studentsCount === "string" && studentsCount.trim()) {
      return studentsCount.trim();
    }

    return "1,000+";
  }, [studentsCount]);

  const cardTags = useMemo(() => {
    const providedTags = Array.isArray(tags) ? tags : [];
    const cleanedProvidedTags = providedTags.map((item) => String(item || "").trim()).filter(Boolean);

    if (cleanedProvidedTags.length > 0) {
      return [...new Set(cleanedProvidedTags)].slice(0, 4);
    }

    const derived = [];
    const normalizedDuration = String(duration || "").toLowerCase();

    if (normalizedDuration.includes("live")) {
      derived.push("Live");
    }

    if (normalizedDuration.includes("recorded")) {
      derived.push("Recorded");
    }

    if (!derived.length) {
      derived.push("Live", "Recorded");
    }

    if (language) {
      derived.push(language);
    }

    if (category) {
      derived.push(category);
    }

    return [...new Set(derived.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 4);
  }, [tags, duration, language, category]);

  const displayBadge = useMemo(() => {
    const normalized = String(badgeType || "").trim().toLowerCase();

    if (normalized === "popular") {
      return {
        label: "Popular",
        tone: "popular",
      };
    }

    if (normalized === "new") {
      return {
        label: "New Batch",
        tone: "new",
      };
    }

    if (normalized === "limited") {
      return {
        label: "Limited Seats",
        tone: "limited",
      };
    }

    if (popular) {
      return {
        label: "Popular",
        tone: "popular",
      };
    }

    return null;
  }, [badgeType, popular]);

  // Check if user is already enrolled in this course
  useEffect(() => {
    if (resolvedCourseId) {
      const enrolled = hasAccessToCourse(resolvedCourseId);
      setIsEnrolled(enrolled);
    }
  }, [resolvedCourseId, hasAccessToCourse]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setMessageType(null);

      if (!resolvedCourseId) {
        setMessage("Course details are unavailable right now.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Check if already enrolled
      if (isEnrolled) {
        setMessage("You are already enrolled in this course");
        setMessageType("info");
        setLoading(false);
        return;
      }

      // Get user data
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in to enroll in courses");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const courseData = {
        _id: resolvedCourseId,
        name,
        image,
        description,
        instructor,
        category,
        price,
        duration,
      };

      // Navigate to checkout page
      navigate("/checkout", {
        state: { course: courseData },
      });
    } catch (error) {
      console.error("❌ Navigation error:", error);
      setMessage("An error occurred. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <article className="course-card">
      <div className="course-image-wrap">
        <img src={image} alt={name} className="course-image" />
        {displayBadge && (
          <span className={`course-popular-badge course-popular-badge-${displayBadge.tone}`}>
            {displayBadge.label}
          </span>
        )}
      </div>

      <div className="course-content">
        <div className="course-text-block">
          <h3 className="course-title">{name}</h3>

          <p className="course-desc">
            {description || "Comprehensive preparation course designed for stronger exam confidence."}
          </p>
        </div>

        <div className="course-info-stack">
          {/* <div className="course-tags" aria-label="Course format and highlights">
            {cardTags.map((tag) => (
              <span className="course-tag" key={`${resolvedCourseId || name}-${tag}`}>
                {tag}
              </span>
            ))}
          </div> */}

          <p className="course-mentor-line" aria-label="Mentor credibility">
            <GraduationCap size={14} />
            <span>{instructor}</span>
            <span className="course-mentor-separator" aria-hidden="true">
              •
            </span>
            <span>{mentorExperience}</span>
          </p>
        </div>

        <div className="course-divider" aria-hidden="true" />

        <div className="course-trust-row" aria-label="Course trust elements">
          <span className="course-trust-item">
            <Star size={14} />
            {displayRating} rating
          </span>
          <span className="course-trust-dot" aria-hidden="true" />
          <span className="course-trust-item">
            <Users size={14} />
            {displayStudents} students
          </span>
        </div>

        <div className="course-conversion-row">
          <div className="course-price-wrap">
            <span className="course-price-label">Starting at</span>
            <span className="course-price">{displayPrice}</span>
          </div>

          <div className="course-action-row">
            <button
              className={`enroll-btn ${isEnrolled ? "already-enrolled" : ""}`}
              onClick={handlePayment}
              disabled={loading || isEnrolled}
              title={isEnrolled ? "You are already enrolled in this course" : "Enroll in this course"}
            >
              {loading && !isEnrolled
                ? "Processing..."
                : isEnrolled
                  ? "✓ Already Enrolled"
                  : "Enroll Now"}
            </button>

            <button
              type="button"
              className="course-outline-btn"
              onClick={() =>
                navigate(resolvedCourseId ? `/courses/${resolvedCourseId}` : "/courses")
              }
            >
              View Details
            </button>
          </div>
        </div>

        {message && <div className={`course-message ${messageType}`}>{message}</div>}
      </div>
    </article>
  );
}

export default CourseCard;

