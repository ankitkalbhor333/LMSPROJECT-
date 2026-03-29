import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaSync, FaCheckCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import { useToast } from "../../contexts/ToastContext";
import "./AdminContacts.css";
import API from "../../utils/api";

const AdminContacts = () => {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ status: "", adminResponse: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const statuses = ["new", "read", "responded", "archived"];

  // Fetch contacts list
  const fetchContacts = async (page = 1) => {
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

      const response = await API.get(`/contact?${params}`);
      
      if (response.data.success) {
        setContacts(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch contacts");
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await API.get("/contact/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContacts(1);
    fetchStats();
  }, []);

  // Refetch when search or filter changes
  useEffect(() => {
    fetchContacts(1);
  }, [searchQuery, statusFilter]);

  // View contact details
  const handleViewDetails = async (contact) => {
    setSelectedContact(contact);
  };

  // Open edit modal
  const handleEdit = (contact) => {
    setEditingId(contact._id);
    setEditData({
      status: contact.status,
      adminResponse: contact.adminResponse || "",
    });
    setShowEditModal(true);
  };

  // Save changes
  const handleSaveEdit = async () => {
    try {
      const response = await API.patch(`/contact/${editingId}`, editData);

      if (response.data.success) {
        setShowEditModal(false);
        fetchContacts(currentPage);
        fetchStats();
        toast.success("Contact updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contact");
    }
  };

  // Delete contact
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        const response = await API.delete(`/contact/${id}`);

        if (response.data.success) {
          fetchContacts(currentPage);
          fetchStats();
          toast.success("Contact deleted successfully!");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete contact");
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
      read: "#f59e0b",
      responded: "#10b981",
      archived: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div className="admin-contacts-container">
      <div className="contacts-header">
        <h1>💬 Contact Messages</h1>
        <button
          className="refresh-btn"
          onClick={() => {
            fetchContacts(1);
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
            <h3>Total Messages</h3>
            <p className="stat-value">{stats.totalMessages || 0}</p>
          </div>
          <div className="stat-card danger">
            <h3>Unread</h3>
            <p className="stat-value">{stats.unreadCount || 0}</p>
          </div>
          <div className="stat-card warning">
            <h3>Read</h3>
            <p className="stat-value">{stats.statusBreakdown?.read || 0}</p>
          </div>
          <div className="stat-card success">
            <h3>Responded</h3>
            <p className="stat-value">{stats.statusBreakdown?.responded || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Archived</h3>
            <p className="stat-value">{stats.statusBreakdown?.archived || 0}</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="contacts-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
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

      {/* Contacts Grid */}
      <div className="contacts-grid-wrapper">
        {loading ? (
          <div className="loading-cell">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="empty-cell">No contacts found</div>
        ) : (
          <div className="contacts-grid">
            {contacts.map((contact) => (
              <div key={contact._id} className="contact-card">
                <div className="card-header">
                  <h3 className="card-name">{contact.fullName}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(contact.status) }}
                  >
                    {contact.status}
                  </span>
                </div>
                
                <div className="card-content">
                  <div className="card-field">
                    <label>Email</label>
                    <a href={`mailto:${contact.email}`} className="field-value email-link">
                      <FaEnvelope style={{ marginRight: "8px", fontSize: "0.9em" }} />
                      {contact.email}
                    </a>
                  </div>
                  
                  <div className="card-field">
                    <label>Phone</label>
                    <div className="field-value">
                      {contact.phoneNumber ? (
                        <>
                          <FaPhone style={{ marginRight: "8px", fontSize: "0.9em" }} />
                          {contact.phoneNumber}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  
                  <div className="card-field">
                    <label>Subject</label>
                    <div 
                      className="field-value subject-text"
                      onClick={() => handleViewDetails(contact)}
                      style={{ cursor: "pointer" }}
                      title={contact.subject}
                    >
                      {contact.subject}
                    </div>
                  </div>
                  
                  <div className="card-field">
                    <label>Submitted</label>
                    <small className="field-value">{formatDate(contact.createdAt)}</small>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() => handleViewDetails(contact)}
                  >
                    📄 View
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(contact)}
                  >
                    <FaEdit /> Reply
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(contact._id)}
                  >
                    <FaTrash />
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
            onClick={() => fetchContacts(currentPage - 1)}
          >
            ← Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => fetchContacts(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* View Details Modal */}
      {selectedContact && !showEditModal && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h2>{selectedContact.fullName}</h2>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(selectedContact.status) }}
              >
                {selectedContact.status}
              </span>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <strong>Email:</strong>
                <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
              </div>
              {selectedContact.phoneNumber && (
                <div className="detail-item">
                  <strong>Phone:</strong>
                  <a href={`tel:${selectedContact.phoneNumber}`}>{selectedContact.phoneNumber}</a>
                </div>
              )}
              <div className="detail-item">
                <strong>Subject:</strong>
                <span>{selectedContact.subject}</span>
              </div>
              <div className="detail-item">
                <strong>Submitted:</strong>
                <span>{formatDate(selectedContact.createdAt)}</span>
              </div>
            </div>

            <div className="message-section">
              <h3>Message:</h3>
              <div className="message-box">
                {selectedContact.message}
              </div>
            </div>

            {selectedContact.adminResponse && (
              <div className="response-section">
                <h3>Your Response:</h3>
                <div className="response-box">
                  {selectedContact.adminResponse}
                </div>
                <small>Responded: {formatDate(selectedContact.respondedAt)}</small>
              </div>
            )}

            <div className="details-buttons">
              <button
                className="btn-edit"
                onClick={() => {
                  handleEdit(selectedContact);
                  setSelectedContact(null);
                }}
              >
                <FaEdit /> Add Response
              </button>
              <button
                className="btn-cancel"
                onClick={() => setSelectedContact(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reply to Contact</h2>

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
              <label>Your Response</label>
              <textarea
                value={editData.adminResponse}
                onChange={(e) =>
                  setEditData({ ...editData, adminResponse: e.target.value })
                }
                placeholder="Type your response to the customer..."
                rows="6"
              />
            </div>

            <div className="modal-buttons">
              <button className="btn-save" onClick={handleSaveEdit}>
                <FaCheckCircle /> Send Response
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

export default AdminContacts;
