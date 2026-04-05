import React, { useEffect, useState } from "react";
import "./MyBatches.css";
import { useNavigate } from "react-router-dom";
import { useEnrollment } from "../../hooks/useEnrollment";
import PurchasedCourseCard from "../../components/homecomponent/PurchasedCourseCard";
import { resolveThumbnailUrl } from "../../utils/mediaUrl";

const MyBatches = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    enrolledCourses,
    loading,
    error,
    refreshEnrollments
  } = useEnrollment();

  // Refresh enrollments on component mount
  useEffect(() => {
    console.log("📚 MyBatches component mounted, fetching enrollments...");
    refreshEnrollments();
  }, []);

  const handleRetry = async () => {
    setIsRefreshing(true);
    try {
      await refreshEnrollments();
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log("🔍 Current state:", {
    loading,
    error,
    coursesCount: enrolledCourses?.length || 0,
    courses: enrolledCourses
  });

  if (loading && !enrolledCourses.length) {
    return (
      <div className="mybatches-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mybatches-container">
      <div className="mybatches-header">
        <h1>My Batches</h1>
        <p className="mybatches-subtitle">View all courses you have purchased</p>
      </div>

      <div className="mybatches-main">
        {error && (
          <div className="error-message-box">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <p className="error-title">Unable to load your batches</p>
              <p className="error-text">{error}</p>
            </div>
            <button 
              className="retry-btn"
              onClick={handleRetry}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {!error && enrolledCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2>No Batches Yet</h2>
            <p>You haven't purchased any batches yet.</p>
            <button 
              className="browse-btn"
              onClick={() => navigate("/courses")}
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {enrolledCourses.map((enrollment) => {
              // enrollment should have courseId populated with full course data
              const course = enrollment.courseId;
              
              // Validate course data exists
              if (!course) {
                console.warn("⚠️ Missing course data in enrollment:", enrollment);
                return null;
              }

              const courseId = course._id || course;
              const teacherName = course.teacher?.name || "Unknown Instructor";
              
              return (
                <PurchasedCourseCard
                  key={enrollment._id}
                  image={
                    course.thumbnail
                      ? resolveThumbnailUrl(course.thumbnail)
                      : "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  name={course.title || "Untitled Course"}
                  description={course.description || "No description available"}
                  instructor={teacherName}
                  category={course.category || "Not specified"}
                  price={course.price || 0}
                  duration={course.duration || "Not specified"}
                  courseId={courseId}
                  status={enrollment.status}
                  enrollmentDate={enrollment.enrollmentDate}
                  enrollmentId={enrollment._id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBatches;
