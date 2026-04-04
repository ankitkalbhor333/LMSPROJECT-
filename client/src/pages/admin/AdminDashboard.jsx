import { useEffect, useState } from "react";
import API from "../../utils/api";
import "./AdminDashboard.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#4f46e5"];
const MONTH_ORDER = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📊 Loading admin dashboard data...");
      
      const [cRes, eRes, rRes] = await Promise.all([
        API.get("/courses"),
        API.get("/enrollment/admin/all"),
        API.get("/results/all"),
      ]);

      console.log("✅ Courses:", cRes.data);
      console.log("✅ Enrollments:", eRes.data);
      console.log("✅ Results:", rRes.data);

      setCourses(cRes.data?.data || cRes.data || []);
      setEnrollments(eRes.data?.data || eRes.data || []);
      setResults(rRes.data?.data || rRes.data || []);
    } catch (err) {
      console.error("❌ Error loading dashboard:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyCounts = (items, dateField = "createdAt") => {
    const map = {};
    items.forEach((i) => {
      const date = i[dateField] || i.createdAt;
      if (!date) return;
      
      const key = new Date(date).toLocaleString("default", {
        month: "short",
      });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.keys(map)
      .sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99))
      .map((k) => ({ name: k, count: map[k] }));
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-head">
          <h1>Admin Dashboard</h1>
          <p>Overview of courses, enrollments, and student performance.</p>
        </div>
        <div className="admin-dashboard-state-card">
          <div className="admin-dashboard-spinner-wrap">
            <div className="admin-dashboard-spinner"></div>
          </div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-head">
          <h1>Admin Dashboard</h1>
          <p>Overview of courses, enrollments, and student performance.</p>
        </div>
        <div className="admin-dashboard-state-card error">
          <div className="admin-dashboard-error-row">
            <div className="admin-dashboard-error-icon">!</div>
            <div className="admin-dashboard-error-copy">
              <h3>Error loading dashboard</h3>
              <p>{error}</p>
            </div>
            <button onClick={loadAll} className="admin-dashboard-btn primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const monthlyEnrollments = getMonthlyCounts(enrollments, "enrollmentDate");
  const monthlyResults = getMonthlyCounts(results, "createdAt");

  const courseDistribution = courses.map((c) => ({
    name: c.title,
    value: c.enrollmentCount || 0,
  }));

  const topCourse = [...courseDistribution].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-head">
        <h1>Admin Dashboard</h1>
        <p>Overview of courses, enrollments, and student performance.</p>
      </div>

      <div className="admin-dashboard-kpi-grid">
        <div className="admin-dashboard-kpi-card">
          <p className="label">Total Courses</p>
          <p className="value">{courses.length}</p>
          <p className="hint">All published and draft courses</p>
        </div>

        <div className="admin-dashboard-kpi-card">
          <p className="label">Total Enrollments</p>
          <p className="value">{enrollments.length}</p>
          <p className="hint">Active student registrations</p>
        </div>

        <div className="admin-dashboard-kpi-card">
          <p className="label">Total Results</p>
          <p className="value">{results.length}</p>
          <p className="hint">Submitted assessments and tests</p>
        </div>

        <div className="admin-dashboard-kpi-card highlight">
          <p className="label">Top Enrolled Course</p>
          <p className="value small">{topCourse?.name || "No data"}</p>
          <p className="hint">{topCourse ? `${topCourse.value} enrollments` : "No enrollments yet"}</p>
        </div>
      </div>

      <div className="admin-dashboard-chart-grid">
        <section className="admin-dashboard-chart-card">
          <div className="card-head">
            <h2>Monthly Enrollments</h2>
            <span>Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEnrollments} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 25px rgba(17, 24, 39, 0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="admin-dashboard-chart-card">
          <div className="card-head">
            <h2>Monthly Results</h2>
            <span>Volume</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyResults} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 25px rgba(17, 24, 39, 0.08)",
                }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="admin-dashboard-chart-card full">
        <div className="card-head">
          <h2>Course Enrollment Distribution</h2>
          <span>By course</span>
        </div>
        {courseDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={courseDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={54}
                paddingAngle={2}
                label
              >
                {courseDistribution.map((entry, i) => (
                  <Cell key={`${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 25px rgba(17, 24, 39, 0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="admin-dashboard-empty-chart">No course data available yet.</div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;