import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import axios from "axios";
import { getApiUrl } from "../../utils/api";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    courseId: "",
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [coursesRes, classesRes] = await Promise.all([
        axios
          .get(`${getApiUrl()}/api/courses/list`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => axios.get(`${getApiUrl()}/api/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] }))),
        axios.get(`${getApiUrl()}/api/live-classes/upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const rawCourses = Array.isArray(coursesRes?.data)
        ? coursesRes.data
        : coursesRes?.data?.data || coursesRes?.data?.courses || [];

      const normalizedCourses = rawCourses.map((course) => ({
        _id: course._id || course.id,
        name: course.name || course.title || course.courseName || "Untitled Batch",
        title: course.title || course.name || course.courseName || "Untitled Batch",
      }));

      setCourses(normalizedCourses);
      setUpcomingClasses(classesRes.data?.data || classesRes.data || []);
    } catch (error) {
      console.warn("Error loading dashboard data", error);
      setCourses([]);
      setUpcomingClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartClass = (classId) => {
    navigate(`/teacher/live-class/${classId}`);
  };

  const handleScheduleFormChange = (event) => {
    const { name, value } = event.target;
    setScheduleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!token) {
      toast?.error?.("Please login again as a teacher.");
      return;
    }

    if (!storedUser || (storedUser.role && storedUser.role !== "teacher" && storedUser.role !== "admin")) {
      toast?.error?.("Only teacher/admin accounts can schedule live classes.");
      return;
    }

    if (!scheduleForm.courseId || !scheduleForm.title || !scheduleForm.scheduledAt || !scheduleForm.duration) {
      toast?.error?.("Please fill in all required live class fields.");
      return;
    }

    if (courses.length === 0) {
      toast?.error?.("No courses are available. Create a course first.");
      return;
    }

    const selectedCourse = courses.find((course) => String(course._id || course.id) === String(scheduleForm.courseId));
    if (!selectedCourse) {
      toast?.error?.("Please select a valid batch.");
      return;
    }

    try {
      setIsScheduling(true);

      await axios.post(
        `${getApiUrl()}/api/live-classes`,
        {
          courseId: scheduleForm.courseId,
          title: scheduleForm.title,
          description: scheduleForm.description,
          scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
          duration: Number(scheduleForm.duration),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast?.success?.("Live class scheduled successfully.");
      setScheduleForm({
        courseId: "",
        title: "",
        description: "",
        scheduledAt: "",
        duration: 60,
      });
      setActiveTab("classes");
      await loadDashboardData();
    } catch (error) {
      console.error("Error scheduling live class:", error);
      toast?.error?.(error.response?.data?.message || "Unable to schedule live class.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <div className="teacher-dashboard">
      {/* Header */}
      <div className="teacher-header">
        <div className="teacher-header-content">
          <div>
            <h1>Welcome, {user?.name || "Teacher"}</h1>
            <p className="teacher-role">Teacher Dashboard</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="teacher-tabs">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "classes" ? "active" : ""}`}
          onClick={() => setActiveTab("classes")}
        >
          🎓 My Classes
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="teacher-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="dashboard-section">
                <div className="section-card schedule-card">
                  <h2>Schedule a Live Class</h2>
                  <form className="schedule-form" onSubmit={handleScheduleSubmit}>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Available Batch</span>
                        <select
                          name="courseId"
                          value={scheduleForm.courseId}
                          onChange={handleScheduleFormChange}
                          disabled={courses.length === 0}
                        >
                          <option value="">Select a batch</option>
                          {courses.map((course) => (
                            <option key={course._id || course.id} value={course._id || course.id}>
                              {course.title || course.name || "Untitled Batch"}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Class Title</span>
                        <input
                          type="text"
                          name="title"
                          value={scheduleForm.title}
                          onChange={handleScheduleFormChange}
                          placeholder="e.g. Algebra Revision Class"
                        />
                      </label>

                      <label className="form-field">
                        <span>Scheduled Date & Time</span>
                        <input
                          type="datetime-local"
                          name="scheduledAt"
                          value={scheduleForm.scheduledAt}
                          onChange={handleScheduleFormChange}
                        />
                      </label>

                      <label className="form-field">
                        <span>Duration (minutes)</span>
                        <input
                          type="number"
                          name="duration"
                          min="15"
                          step="5"
                          value={scheduleForm.duration}
                          onChange={handleScheduleFormChange}
                        />
                      </label>
                    </div>

                    <label className="form-field full-width">
                      <span>Class Description</span>
                      <textarea
                        name="description"
                        value={scheduleForm.description}
                        onChange={handleScheduleFormChange}
                        rows="4"
                        placeholder="Add short notes for students about the class topic"
                      />
                    </label>

                    <div className="schedule-actions">
                      <button type="submit" className="primary-btn" disabled={isScheduling || courses.length === 0}>
                        {isScheduling ? "Scheduling..." : "Schedule Live Class"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Quick Stats */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                      <div className="stat-label">Total Courses</div>
                      <div className="stat-value">{courses.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎬</div>
                    <div className="stat-content">
                      <div className="stat-label">Upcoming Classes</div>
                      <div className="stat-value">{upcomingClasses.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <div className="stat-label">Total Students</div>
                      <div className="stat-value">—</div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Classes */}
                {upcomingClasses.length > 0 && (
                  <div className="section-card">
                    <h2>Upcoming Live Classes</h2>
                    <div className="classes-list">
                      {upcomingClasses.slice(0, 5).map((liveClass) => (
                        <div key={liveClass._id} className="class-item">
                          <div className="class-info">
                            <h3>{liveClass.title}</h3>
                            <div className="class-meta">
                              <span className="class-date">
                                📅 {new Date(liveClass.scheduledAt).toLocaleString()}
                              </span>
                              <span className="class-duration">
                                ⏱️ {liveClass.duration} minutes
                              </span>
                            </div>
                            <p className="class-status">{liveClass.status}</p>
                          </div>
                          <button
                            onClick={() => handleStartClass(liveClass._id)}
                            className="start-class-btn"
                          >
                            Start Class →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Your Courses */}
                {courses.length > 0 && (
                  <div className="section-card">
                    <h2>Your Courses</h2>
                    <div className="courses-grid">
                      {courses.slice(0, 6).map((course) => (
                        <div key={course._id} className="course-card">
                          {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt={course.name}
                              className="course-thumbnail"
                            />
                          )}
                          <div className="course-content">
                            <h3>{course.name}</h3>
                            <p>{course.description?.substring(0, 60)}...</p>
                            <button
                              onClick={() => navigate(`/admin/course/${course._id}`)}
                              className="view-course-btn"
                            >
                              View Course
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === "classes" && (
              <div className="classes-section">
                <div className="section-card">
                  <h2>My Live Classes</h2>
                  {upcomingClasses.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <p>No upcoming live classes scheduled.</p>
                      <p className="empty-hint">
                        Schedule a new live class from your course settings.
                      </p>
                    </div>
                  ) : (
                    <div className="classes-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Scheduled At</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingClasses.map((liveClass) => (
                            <tr key={liveClass._id}>
                              <td>{liveClass.title}</td>
                              <td>
                                {new Date(liveClass.scheduledAt).toLocaleString()}
                              </td>
                              <td>{liveClass.duration} min</td>
                              <td>
                                <span
                                  className={`status-badge status-${liveClass.status}`}
                                >
                                  {liveClass.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => handleStartClass(liveClass._id)}
                                  className="action-btn"
                                >
                                  Start
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="profile-section">
                <div className="section-card">
                  <h2>Teacher Profile</h2>
                  <div className="profile-content">
                    <div className="profile-field">
                      <label>Name</label>
                      <p>{user?.name || "N/A"}</p>
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <p>{user?.email || "N/A"}</p>
                    </div>
                    <div className="profile-field">
                      <label>Role</label>
                      <p>{user?.role || "N/A"}</p>
                    </div>
                    <div className="profile-field">
                      <label>Member Since</label>
                      <p>
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/profile")}
                    className="edit-profile-btn"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
