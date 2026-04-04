import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { resolveInstructorName } from "../../utils/courseIdentity";
import CourseBuilder from "../CourseBuilder";
import "./CourseBuilderAdmin.css";

function CourseBuilderAdmin() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/courses");
      setCourses(res.data || []);
    } catch (err) {
      setError("Failed to load courses: " + (err.response?.data?.message || err.message));
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="course-builder-admin">
        <div className="loading-spinner">Loading courses...</div>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="course-builder-admin">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={loadCourses}>
          Retry
        </button>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="course-builder-admin">
        <div className="courses-selector">
          <h2>Select a Course to Edit Structure</h2>
          <p className="subtitle">
            Manage subjects, units, lectures, and materials for your courses.
          </p>

          <div className="courses-list">
            {courses && courses.length > 0 ? (
              courses.map((course) => (
                <div key={course._id} className="course-card-selector">
                  <div className="course-image">
                    {course.thumbnail ? (
                      <img src={`${import.meta.env.VITE_API_URL || 'https://lmsproject1-cuzs.onrender.com'}/${course.thumbnail}` || "https://via.placeholder.com/300x200?text=No+Image"} alt={course.title} />
                    ) : (
                      <div className="no-image">📚</div>
                    )}
                  </div>
                  <div className="course-details">
                    <h3>{course.title}</h3>
                    <p className="description">{course.description}</p>
                    <div className="course-meta">
                      <span className="meta-item">
                        👨‍🏫 {resolveInstructorName(course)}
                      </span>
                      <span className="meta-item">
                        📊 {course.studentsEnrolled?.length || 0} students
                      </span>
                      {course.subjects && (
                        <span className="meta-item">
                          📕 {course.subjects.length} subjects
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedCourse(course)}
                  >
                    Edit Structure →
                  </button>
                </div>
              ))
            ) : (
              <div className="no-courses">
                <p>No courses available. Create a course first!</p>
                <button
                  className="btn btn-success"
                  onClick={() => navigate("/admin/create-course")}
                >
                  Create Course
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-builder-admin course-builder-active">
      <button
        className="btn btn-secondary btn-back"
        onClick={() => setSelectedCourse(null)}
      >
        ← Back to Courses
      </button>
      <CourseBuilder courseId={selectedCourse._id} />
    </div>
  );
}

export default CourseBuilderAdmin;
