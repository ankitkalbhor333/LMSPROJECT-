import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaSync, FaCheckCircle, FaPhone, FaMapPin } from "react-icons/fa";
import { useToast } from "../../contexts/ToastContext";
import "./AdminEnquiries.css";
import API from "../../utils/api";

const AdminEnquiries = () => {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ status: "", notes: "" });
  const [showEditModal, setShowEditModal] = useState(false);

  const statuses = ["new", "contacted", "converted", "not-interested"];
  const courses = ["NEET", "JEE", "Class 10", "Class 11", "Class 12", "Other"];

  // Fetch enquiries list
  const fetchEnquiries = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page,
        limit,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        sort: "-createdAt",
      });

      const response = await API.get(`/enquiry?${params}`);
      
      if (response.data.success) {
        setEnquiries(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch enquiries");
      console.error("Error fetching enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await API.get("/enquiry/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEnquiries(1);
    fetchStats();
  }, []);

  // Refetch when search or filter changes
  useEffect(() => {
    fetchEnquiries(1);
  }, [searchQuery, statusFilter]);

  // Open edit modal
  const handleEdit = (enquiry) => {
    setEditingId(enquiry._id);
    setEditData({
      status: enquiry.status,
      notes: enquiry.notes || "",
    });
    setShowEditModal(true);
  };

  // Save changes
  const handleSaveEdit = async () => {
    try {
      const response = await API.patch(`/enquiry/${editingId}`, editData);

      if (response.data.success) {
        setShowEditModal(false);
        fetchEnquiries(currentPage);
        fetchStats();
        toast.success("Enquiry updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update enquiry");
    }
  };

  // Delete enquiry
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      try {
        const response = await API.delete(`/enquiry/${id}`);

        if (response.data.success) {
          fetchEnquiries(currentPage);
          fetchStats();
          toast.success("Enquiry deleted successfully!");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete enquiry");
      }
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      new: "#ef4444",
      contacted: "#f59e0b",
      converted: "#10b981",
      "not-interested": "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div className="admin-enquiries-container">
      <div className="enquiries-header">
        <h1>📋 Lead Management (Enquiries)</h1>
        <button
          className="refresh-btn"
          onClick={() => {
            fetchEnquiries(1);
            fetchStats();
          }}
        >
          <FaSync /> Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Enquiries</h3>
            <p className="stat-value">{stats.totalEnquiries || 0}</p>
          </div>
          <div className="stat-card success">
            <h3>Converted</h3>
            <p className="stat-value">{stats.statusBreakdown?.converted || 0}</p>
          </div>
          <div className="stat-card warning">
            <h3>Contacted</h3>
            <p className="stat-value">{stats.statusBreakdown?.contacted || 0}</p>
          </div>
          <div className="stat-card danger">
            <h3>New Leads</h3>
            <p className="stat-value">{stats.statusBreakdown?.new || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Course Breakdown</h3>
            <div className="course-list">
              {stats.courseBreakdown?.slice(0, 3).map((course) => (
                <span key={course._id} className="course-badge">
                  {course._id}: {course.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="enquiries-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enquiries Grid */}
      <div className="enquiries-grid-wrapper">
        {loading ? (
          <div className="loading-cell">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="empty-cell">No enquiries found</div>
        ) : (
          <div className="enquiries-grid">
            {enquiries.map((enquiry) => (
              <div key={enquiry._id} className="enquiry-card">
                <div className="card-header">
                  <h3 className="card-name">{enquiry.fullName}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(enquiry.status) }}
                  >
                    {enquiry.status}
                  </span>
                </div>
                
                <div className="card-content">
                  <div className="card-field">
                    <label>Phone</label>
                    <div className="field-value">
                      <FaPhone style={{ marginRight: "8px", fontSize: "0.9em" }} />
                      {enquiry.phoneNumber}
                    </div>
                  </div>
                  
                  <div className="card-field">
                    <label>Course</label>
                    <span className="course-tag">{enquiry.course}</span>
                  </div>
                  
                  <div className="card-field">
                    <label>City</label>
                    <div className="field-value">
                      <FaMapPin style={{ marginRight: "8px", fontSize: "0.9em" }} />
                      {enquiry.city || "-"}
                    </div>
                  </div>
                  
                  <div className="card-field">
                    <label>Submitted</label>
                    <small className="field-value">{formatDate(enquiry.createdAt)}</small>
                  </div>
                  
                  {enquiry.notes && (
                    <div className="card-field">
                      <label>Notes</label>
                      <small className="field-value">{enquiry.notes}</small>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(enquiry)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(enquiry._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchEnquiries(currentPage - 1)}
          >
            ← Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => fetchEnquiries(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Enquiry</h2>

            <div className="form-group">
              <label>Status</label>
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={editData.notes}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                placeholder="Add notes about this lead..."
                rows="4"
              />
            </div>

            <div className="modal-buttons">
              <button className="btn-save" onClick={handleSaveEdit}>
                <FaCheckCircle /> Save Changes
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnquiries;
