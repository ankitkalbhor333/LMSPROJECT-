import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, PlayCircle, Star, Users } from "lucide-react";
import "./CourseCard.css";

function PurchasedCourseCard({
  image,
  name,
  description,
  instructor,
  category,
  price,
  duration,
  courseId,
  _id,
  enrollmentId,
  status,
  enrollmentDate,
  rating = 4.8,
  studentsCount = "1,000+",
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resolvedCourseId = courseId || _id;

  const parsedPrice = Number(price);
  const displayPrice = Number.isFinite(parsedPrice)
    ? `₹${parsedPrice.toLocaleString("en-IN")}`
    : price
      ? `₹${price}`
      : "Free";

  const displayRating = Number.isFinite(Number(rating))
    ? Number(rating).toFixed(1)
    : "4.8";

  const normalizedStatus = String(status || "active").toLowerCase();
  const statusBadge = {
    active: { label: "Enrolled", tone: "new" },
    completed: { label: "Completed", tone: "popular" },
    paused: { label: "Paused", tone: "limited" },
  }[normalizedStatus] || { label: "Enrolled", tone: "new" };

  const handleContinue = async () => {
    try {
      setLoading(true);
      // Navigate to batch entry dashboard
      const id = resolvedCourseId;
      navigate(`/batch/${id}`, {
        state: { enrollmentId, status }
      });
    } catch (error) {
      console.error("❌ Navigation error:", error);
      setLoading(false);
    }
  };

  return (
    <article className="course-card">
      <div className="course-image-wrap">
        <img src={image} alt={name} className="course-image" />
        <span className={`course-popular-badge course-popular-badge-${statusBadge.tone}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="course-content">
        <div className="course-text-block">
          <h3 className="course-title">{name}</h3>
          <p className="course-desc">
            {description || "Continue learning from where you left off in this batch."}
          </p>
        </div>

        <div className="course-info-stack">
          {/* <div className="course-tags" aria-label="Course tags">
            <span className="course-tag">{category || "General"}</span>
            <span className="course-tag">{duration || "Self-paced"}</span>
            {enrollmentDate && (
              <span className="course-tag">
                Joined {new Date(enrollmentDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            )}
          </div> */}

          <p className="course-mentor-line" aria-label="Instructor details">
            <GraduationCap size={14} />
            <span>{instructor || "Expert Faculty"}</span>
          </p>
        </div>

        <div className="course-divider" aria-hidden="true" />

        <div className="course-trust-row" aria-label="Course trust info">
          <span className="course-trust-item">
            <Star size={14} />
            {displayRating} rating
          </span>
          <span className="course-trust-dot" aria-hidden="true" />
          <span className="course-trust-item">
            <Users size={14} />
            {studentsCount} students
          </span>
        </div>

        <div className="course-conversion-row">
          <div className="course-price-wrap">
            <span className="course-price-label">You paid</span>
            <span className="course-price">{displayPrice}</span>
          </div>

          <div className="course-action-row">
            <button
              className="enroll-btn"
              onClick={handleContinue}
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue Batch"}
            </button>

            <button
              type="button"
              className="course-outline-btn"
              onClick={() => navigate(resolvedCourseId ? `/courses/${resolvedCourseId}` : "/courses")}
            >
              <PlayCircle size={14} /> View Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PurchasedCourseCard;
