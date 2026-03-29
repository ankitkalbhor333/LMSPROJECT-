import React, { useEffect, useMemo, useState } from "react";
import API from "../../utils/api";
import enrollmentAPI from "../../utils/enrollmentAPI";
import "./AdminStudents.css";

const getErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const normalizeStudentList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getStudentId = (student) => String(student?._id || student?.id || "");

const getStudentName = (student) => {
  const name = String(student?.name || "").trim();
  return name || "Unknown Student";
};

const getStudentEmail = (student) => {
  const email = String(student?.email || "").trim();
  return email || "N/A";
};

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({}); // {studentId: count}
  const [loading, setLoading] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all"); // all, enrolled, not-enrolled
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ===========================
  // Fetch All Students with Enrollment Counts
  // ===========================
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/user/all");
      const studentList = normalizeStudentList(data);
      setStudents(studentList);

      // Fetch enrollment counts in parallel to avoid slow sequential calls.
      const countRequests = studentList.map((student) =>
        enrollmentAPI.getStudentEnrollments(getStudentId(student))
      );

      const countResults = await Promise.allSettled(countRequests);
      const counts = {};

      studentList.forEach((student, index) => {
        const studentId = getStudentId(student);
        const result = countResults[index];

        if (result?.status === "fulfilled" && Array.isArray(result.value)) {
          counts[studentId] = result.value.length;
        } else {
          counts[studentId] = 0;
        }
      });

      setEnrollmentCounts(counts);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load students"));
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // View Single Student Detail with Enrollments
  // ===========================
  const viewStudent = async (id) => {
    try {
      setEnrollmentLoading(true);
      setError("");

      const selected = students.find((student) => getStudentId(student) === String(id)) || null;
      setSelectedStudent(selected);

      const [enrollmentsResponse, resultsResponse] = await Promise.allSettled([
        enrollmentAPI.getStudentEnrollments(id),
        API.get("/results/all"),
      ]);

      if (enrollmentsResponse.status === "fulfilled" && Array.isArray(enrollmentsResponse.value)) {
        setStudentEnrollments(enrollmentsResponse.value);
      } else {
        setStudentEnrollments([]);
      }

      if (resultsResponse.status === "fulfilled") {
        const allResults = Array.isArray(resultsResponse.value?.data?.data)
          ? resultsResponse.value.data.data
          : Array.isArray(resultsResponse.value?.data)
            ? resultsResponse.value.data
            : [];

        const filteredResults = allResults.filter(
          (result) => String(result?.student?._id || result?.student || "") === String(id)
        );

        setStudentResults(filteredResults);
      } else {
        setStudentResults([]);
      }

      setShowDetailModal(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load student details"));
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
    setStudentEnrollments([]);
    setStudentResults([]);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ===========================
  // Filter Students
  // ===========================
  const filteredStudents = useMemo(() => students.filter((student) => {
    // Search filter
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchesSearch = 
      getStudentName(student).toLowerCase().includes(normalizedQuery) ||
      getStudentEmail(student).toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) return false;

    // Enrollment filter
    const enrollmentCount = enrollmentCounts[getStudentId(student)] || 0;
    if (enrollmentFilter === "enrolled") {
      return enrollmentCount > 0;
    } else if (enrollmentFilter === "not-enrolled") {
      return enrollmentCount === 0;
    }
    // enrollmentFilter === "all"
    return true;
  }), [students, searchQuery, enrollmentFilter, enrollmentCounts]);

  const enrolledStudentsCount = useMemo(
    () => students.filter((student) => (enrollmentCounts[getStudentId(student)] || 0) > 0).length,
    [students, enrollmentCounts]
  );

  const nonEnrolledStudentsCount = useMemo(
    () => Math.max(0, students.length - enrolledStudentsCount),
    [students.length, enrolledStudentsCount]
  );

  // ===========================
  // Calculate Statistics from Enrollments
  // ===========================
  const totalStudents = students.length;
  const totalCoursePurchases = students.reduce(
    (sum, student) => sum + (enrollmentCounts[getStudentId(student)] || 0),
    0
  );
  const averageCoursesPerStudent =
    totalStudents > 0 ? (totalCoursePurchases / totalStudents).toFixed(2) : 0;

  return (
    <div className="admin-students-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">👥 Student Management</h1>
          <p className="admin-subtitle">
            Manage and monitor all enrolled students
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Students</h3>
            <p className="stat-value">{totalStudents}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3 className="stat-label">Course Purchases</h3>
            <p className="stat-value">{totalCoursePurchases}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-label">Avg. Courses/Student</h3>
            <p className="stat-value">{averageCoursesPerStudent}</p>
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

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-count">{filteredStudents.length} students found</span>
      </div>

      {/* Enrollment Filter */}
      <div className="filter-container">
        <div className="filter-group">
          <label className="filter-label">Filter by Enrollment:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${enrollmentFilter === "all" ? "active" : ""}`}
              onClick={() => setEnrollmentFilter("all")}
            >
              📊 All Students ({students.length})
            </button>
            <button
              className={`filter-btn ${enrollmentFilter === "enrolled" ? "active" : ""}`}
              onClick={() => setEnrollmentFilter("enrolled")}
            >
              ✅ Enrolled ({enrolledStudentsCount})
            </button>
            <button
              className={`filter-btn ${enrollmentFilter === "not-enrolled" ? "active" : ""}`}
              onClick={() => setEnrollmentFilter("not-enrolled")}
            >
              ❌ Not Enrolled ({nonEnrolledStudentsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Students Table */}
      {!loading && (
        <div className="table-container">
          {filteredStudents.length > 0 ? (
            <table className="students-table">
              <thead>
                <tr>
                  <th className="col-name">Student Name</th>
                  <th className="col-email">Email Address</th>
                  <th className="col-courses">Courses Purchased</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={getStudentId(student)} className="table-row">
                    <td className="col-name">
                      <div className="student-info">
                        <div className="student-avatar">
                          {getStudentName(student).charAt(0).toUpperCase()}
                        </div>
                        <span className="student-name">{getStudentName(student)}</span>
                      </div>
                    </td>
                    <td className="col-email">{getStudentEmail(student)}</td>
                    <td className="col-courses">
                      <span className="course-badge">
                        {enrollmentCounts[getStudentId(student)] || 0} courses
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn-action btn-view"
                        onClick={() => viewStudent(getStudentId(student))}
                        disabled={loading}
                        title="View student details"
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>📚 No students found. Start enrolling students in courses!</p>
            </div>
          )}
        </div>
      )}

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button className="modal-close" onClick={closeDetailModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Student Info Section */}
              <div className="detail-section">
                <h3 className="section-title">👤 Student Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{getStudentName(selectedStudent)}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{getStudentEmail(selectedStudent)}</p>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <p>
                      <span className="badge badge-student">
                        {String(selectedStudent?.role || "student").toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Member Since</label>
                    <p>
                      {selectedStudent?.createdAt
                        ? new Date(selectedStudent.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enrolled Courses Section */}
              <div className="detail-section">
                <h3 className="section-title">📚 Enrolled Courses</h3>
                {enrollmentLoading ? (
                  <div className="loading-spinner">Loading enrollments...</div>
                ) : studentEnrollments?.length > 0 ? (
                  <div className="courses-list">
                    {studentEnrollments.map((enrollment) => (
                      <div key={enrollment._id} className="course-item">
                        <div className="course-info">
                          <h4>{enrollment.courseId?.title || "Unknown Course"}</h4>
                          <p className="course-price">
                            ₹{enrollment.courseId?.price || "N/A"}
                          </p>
                          <p className="enrollment-status">
                            Status: {enrollment.status || "active"}
                          </p>
                        </div>
                        <span className="status-badge active">
                          {enrollment.status === "completed"
                            ? "Completed"
                            : "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <p>No courses enrolled yet</p>
                  </div>
                )}
              </div>

              {/* Test Results Section */}
              <div className="detail-section">
                <h3 className="section-title">📊 Test Results</h3>
                {studentResults?.length > 0 ? (
                  <div className="results-list">
                    {studentResults.map((result) => (
                      <div key={result._id} className="result-item">
                        <div className="result-info">
                          <h4>{result.test?.title || "Test"}</h4>
                          <p className="result-stats">
                            Score: {result.score ?? 0}/{result.totalQuestions ?? 0} ({result.percentage ?? 0}%)
                          </p>
                        </div>
                        <div className="score-circle">
                          <span className="score-text">{result.percentage ?? 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <p>No test attempts yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;