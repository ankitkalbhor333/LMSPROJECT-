import { useEffect, useState } from "react";
import {
  FaPhone,
  FaMapPin,
  FaBook,
  FaSearch,
  FaSync,
  FaCheckCircle,
  FaDownload,
} from "react-icons/fa";
import { useToast } from "../../contexts/ToastContext";
import "./AdminInitialEnquiries.css";
import API from "../../utils/api";

const AdminInitialEnquiries = () => {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch initial enquiries list
  const fetchInitialEnquiries = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page,
        limit,
        ...(searchQuery && { search: searchQuery }),
        sort: "-submittedAt",
      });

      const response = await API.get(`/enquiry/initial-list?${params}`);

      if (response.data.success) {
        setEnquiries(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch initial enquiries"
      );
      console.error("Error fetching initial enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await API.get("/enquiry/initial-stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInitialEnquiries(1);
    fetchStats();
  }, []);

  // Refetch when search changes
  useEffect(() => {
    fetchInitialEnquiries(1);
  }, [searchQuery]);

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

  // Download all enquiries as Excel
  const downloadExcel = async () => {
    try {
      setDownloadLoading(true);
      const response = await API.get(`/enquiry/initial-list/export/excel`, {
        responseType: "blob",
        params: { search: searchQuery || "" },
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `initial-enquiries-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully!");
    } catch (err) {
      console.error("Error downloading Excel:", err);
      toast.error("Failed to download Excel file");
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download all enquiries as PDF
  const downloadPDF = async () => {
    try {
      setDownloadLoading(true);
      const response = await API.get(`/enquiry/initial-list/export/pdf`, {
        responseType: "blob",
        params: { search: searchQuery || "" },
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `initial-enquiries-${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF file downloaded successfully!");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error("Failed to download PDF file");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="admin-initial-enquiries-container">
      <div className="enquiries-header">
        <h1>📝 Initial Enquiry Submissions (New Users)</h1>
        <div className="header-actions">
          <button
            className="action-btn refresh-btn"
            onClick={() => {
              fetchInitialEnquiries(1);
              fetchStats();
              toast.success("Data refreshed!");
            }}
            title="Refresh data"
          >
            <FaSync /> Refresh
          </button>
          <button
            className="action-btn download-btn download-excel"
            onClick={downloadExcel}
            disabled={downloadLoading || enquiries.length === 0}
            title="Download as Excel"
          >
            <FaDownload /> Excel
          </button>
          <button
            className="action-btn download-btn download-pdf"
            onClick={downloadPDF}
            disabled={downloadLoading || enquiries.length === 0}
            title="Download as PDF"
          >
            <FaDownload /> PDF
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="stats-section">
          <div className="stat-card primary">
            <div className="stat-value">{stats.totalSubmitted}</div>
            <div className="stat-label">Total Submissions</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Top Courses</div>
            <div className="stat-list">
              {stats.courseBreakdown.slice(0, 3).map((item) => (
                <div key={item._id} className="stat-item">
                  <span>{item._id || "Not specified"}</span>
                  <span className="stat-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Top Cities</div>
            <div className="stat-list">
              {stats.cityBreakdown.slice(0, 3).map((item) => (
                <div key={item._id} className="stat-item">
                  <span>{item._id || "Not specified"}</span>
                  <span className="stat-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, city, course, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="empty-state">
          <FaCheckCircle className="empty-icon" />
          <p>No initial enquiries found</p>
          {searchQuery && <small>Try adjusting your search</small>}
        </div>
      ) : (
        <>
          {/* Enquiries Grid */}
          <div className="enquiries-grid">
            {enquiries.map((enquiry, index) => (
              <div key={enquiry.userId || index} className="enquiry-card">
                <div className="card-header">
                  <h3 className="card-title">{enquiry.name}</h3>
                  <div className="card-subtitle">{enquiry.userEmail}</div>
                </div>

                <div className="card-body">
                  <div className="card-row">
                    <span className="card-label">
                      <FaPhone className="label-icon" /> Phone
                    </span>
                    <span className="card-value">{enquiry.phoneNumber}</span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">
                      <FaMapPin className="label-icon" /> City
                    </span>
                    <span className="card-value">{enquiry.city}</span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">
                      <FaBook className="label-icon" /> Course
                    </span>
                    <span className="card-value">{enquiry.course}</span>
                  </div>

                  <div className="card-section">
                    <span className="card-label">Message</span>
                    <div className="message-box">{enquiry.message}</div>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Submitted</span>
                    <span className="card-value date-value">
                      {formatDate(enquiry.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchInitialEnquiries(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => fetchInitialEnquiries(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminInitialEnquiries;
