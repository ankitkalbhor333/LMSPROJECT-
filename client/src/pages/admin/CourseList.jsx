import { useEffect, useState } from "react";
import API from "../../utils/api";
import { resolveInstructorName } from "../../utils/courseIdentity";
import "./CourseList.css";

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStudentCount = (course) => {
  if (!course || typeof course !== "object") {
    return 0;
  }

  if (typeof course.enrollmentCount === "number" || typeof course.enrollmentCount === "string") {
    return toSafeNumber(course.enrollmentCount);
  }

  if (typeof course.studentCount === "number" || typeof course.studentCount === "string") {
    return toSafeNumber(course.studentCount);
  }

  if (typeof course.studentsCount === "number" || typeof course.studentsCount === "string") {
    return toSafeNumber(course.studentsCount);
  }

  if (typeof course.totalStudents === "number" || typeof course.totalStudents === "string") {
    return toSafeNumber(course.totalStudents);
  }

  if (Array.isArray(course.studentsEnrolled)) {
    return course.studentsEnrolled.length;
  }

  if (Array.isArray(course.enrollments)) {
    return course.enrollments.length;
  }

  return 0;
};

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/courses");
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setCourses(list);
    } catch (error) {
      setError("Failed to load courses");
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      setLoading(true);
      await API.delete(`/courses/${id}`);
      setCourses(courses.filter((course) => course._id !== id));
      setSuccess("Course deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete course");
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resolveInstructorName(course, "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalCourses = courses.length;
  const totalRevenue = courses.reduce((sum, course) => sum + (course.price || 0), 0);
  const totalStudents = courses.reduce((sum, course) => sum + getStudentCount(course), 0);

  return (
    <div className="course-list-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">📚 Course Management</h1>
          <p className="admin-subtitle">View and manage all your courses</p>
        </div>
        <a href="/admin/create-course" className="btn-create">
          ➕ Add New Course
        </a>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Courses</h3>
            <p className="stat-value">{totalCourses}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Students</h3>
            <p className="stat-value">{totalStudents}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Revenue</h3>
            <p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" role="alert">
          <strong>✗ Error:</strong> {error}
          <button className="close-btn" onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          <strong>✓ Success:</strong> {success}
          <button className="close-btn" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-count">{filteredCourses.length} found</span>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Courses List - Responsive Table/Grid */}
      {!loading && (
        <div className="data-container">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <p>📚 No courses available. Create your first course to get started!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-wrapper">
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th className="col-title">Course Title</th>
                      <th className="col-instructor">Instructor</th>
                      <th className="col-price">Price</th>
                      <th className="col-category">Category</th>
                      <th className="col-students">Students</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course._id} className="table-row">
                        <td className="col-title">
                          <span className="course-title-badge">{course.title}</span>
                        </td>
                        <td className="col-instructor">{resolveInstructorName(course)}</td>
                        <td className="col-price">
                          <span className="price-badge">₹{course.price}</span>
                        </td>
                        <td className="col-category">
                          <span className="category-badge">{course.category || "N/A"}</span>
                        </td>
                        <td className="col-students">
                          <span className="student-count">
                            {getStudentCount(course)}
                          </span>
                        </td>
                        <td className="col-actions">
                          <a
                            href={`/admin/edit-course/${course._id}`}
                            className="btn-action btn-edit"
                            title="Edit course"
                          >
                            ✏️ Edit
                          </a>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(course._id)}
                            disabled={loading}
                            title="Delete course"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                  <div key={course._id} className="course-card">
                    <div className="card-header">
                      <h3 className="card-title">{course.title}</h3>
                    </div>
                    <div className="card-body">
                      <div className="card-row">
                        <span className="card-label">Instructor:</span>
                        <span className="card-value">{resolveInstructorName(course)}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Price:</span>
                        <span className="price-badge">₹{course.price}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Category:</span>
                        <span className="category-badge">{course.category || "N/A"}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Students:</span>
                        <span className="student-count">
                          {getStudentCount(course)}
                        </span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <a
                        href={`/admin/edit-course/${course._id}`}
                        className="btn-action btn-edit"
                      >
                        ✏️ Edit
                      </a>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(course._id)}
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CoursesList;