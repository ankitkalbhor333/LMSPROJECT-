import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import API from "../utils/api";
import { resolveAvatarUrl } from "../utils/mediaUrl";
import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user data on mount
  useEffect(() => {
    console.log("🔍 UserProfile mounted, fetching data...");
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("📡 Calling /user/profile endpoint...");
      const response = await API.get("/user/profile");
      console.log("✅ User data fetched successfully:", response.data);
    
      // Ensure profile objects exist
      const normalizedData = {
        ...response.data,
        avatar: response.data.avatar || "",
        studentProfile: response.data.studentProfile || {
          class: "",
          goals: "",
          learningStyle: "",
          preferredLanguage: "English"
        },
        teacherProfile: response.data.teacherProfile || {
          qualification: "",
          experience: 0,
          bio: "",
          rating: 0
        }
      };
      
      setUser(normalizedData);
      setEditData(normalizedData);
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.msg || err.message || "Failed to fetch user profile";
      console.error("   Error details:", errorMessage);
      setError(errorMessage);
      if (err.response?.status === 401) {
        console.log("⚠️  Unauthorized - redirecting to login");
        setTimeout(() => navigate("/login"), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getAvatarColor = (identity) => {
    const colors = [
      "#4f46e5",
      "#6366f1",
      "#4338ca",
      "#7c3aed",
      "#0ea5e9",
      "#0891b2",
      "#10b981",
      "#2563eb",
    ];
    if (!identity) {
      return colors[0];
    }
    let hash = 0;
    for (let i = 0; i < identity.length; i++) {
      hash = identity.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentProfileChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      studentProfile: {
        ...prev.studentProfile,
        [name]: value,
      },
    }));
  };

  const handleTeacherProfileChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      teacherProfile: {
        ...prev.teacherProfile,
        [name]: value,
      },
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setError("");
      console.log("💾 Updating profile with:", editData);
      const updatePayload = {
        name: editData.name,
      };

      // Add role-specific fields
      if (editData.role === "student" && editData.studentProfile) {
        updatePayload.studentProfile = editData.studentProfile;
      } else if (editData.role === "teacher" && editData.teacherProfile) {
        updatePayload.teacherProfile = editData.teacherProfile;
      }

      console.log("📤 Sending payload:", updatePayload);
      const { data } = await API.put("/user/profile", updatePayload);
      console.log("✅ Profile updated response:", data);
      setUser(data);
      setEditData(data);
      setShowEditForm(false);
      setSuccessMessage("✅ Profile updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update profile";
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Avatar URL resolution is handled by the imported resolveAvatarUrl utility
  const getAvatarUrl = (avatarPath) => {
    return resolveAvatarUrl(avatarPath);
  };

  const handleAvatarButtonClick = () => {
    if (avatarUploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    try {
      setAvatarUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await API.put("/user/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newAvatar = data?.avatar || "";
      setUser((prev) => ({ ...prev, avatar: newAvatar }));
      setEditData((prev) => ({ ...prev, avatar: newAvatar }));
      localStorage.setItem("avatar", newAvatar);
      window.dispatchEvent(new Event("auth-changed"));
      setSuccessMessage("✅ Profile photo updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("❌ Error uploading avatar:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to upload profile photo";
      setError(errorMessage);
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar || avatarRemoving) {
      return;
    }

    const shouldRemove = window.confirm("Remove your profile photo?");
    if (!shouldRemove) {
      return;
    }

    try {
      setAvatarRemoving(true);
      setError("");

      await API.delete("/user/profile/avatar");

      setUser((prev) => ({ ...prev, avatar: "" }));
      setEditData((prev) => ({ ...prev, avatar: "" }));
      localStorage.setItem("avatar", "");
      window.dispatchEvent(new Event("auth-changed"));
      setSuccessMessage("✅ Profile photo removed successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("❌ Error removing avatar:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to remove profile photo";
      setError(errorMessage);
    } finally {
      setAvatarRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <div className="error-content">
            <h2>⚠️ Unable to Load Profile</h2>
            <p>{error || "Profile data not available"}</p>
            <button onClick={fetchUserData} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(user.phone || user.name);
  const initials = getInitials(user.name);
  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <div className="profile-page">
      {/* Success Notification */}
      {successMessage && (
        <div className="notification success-notification">
          <span>✅</span>
          {successMessage}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="notification error-notification">
          <span>❌</span>
          {error}
        </div>
      )}

      {/* Profile Container */}
      <div className="profile-wrapper">
        {/* Header Section */}
        <div className="profile-header-section">
          <div className="profile-header-background"></div>
          
          <div className="profile-header-content">
            <div className="avatar-container">
              <div
                className="avatar-large"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${user.name} profile`} className="avatar-image" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                className="avatar-upload-btn"
                onClick={handleAvatarButtonClick}
                disabled={avatarUploading || avatarRemoving}
                aria-label="Upload profile photo"
                title={avatarUploading ? "Uploading..." : "Upload profile photo"}
              >
                <Camera size={14} />
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className="avatar-remove-btn"
                  onClick={handleRemoveAvatar}
                  disabled={avatarRemoving || avatarUploading}
                  aria-label="Remove profile photo"
                  title={avatarRemoving ? "Removing..." : "Remove profile photo"}
                >
                  {avatarRemoving ? "..." : "×"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="avatar-file-input"
                onChange={handleAvatarChange}
              />
            </div>
            
            <div className="profile-header-info">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-email">{user.phone || "Not provided"}</p>
              
              <div className="status-badges">
                <span className={`role-tag role-${user.role}`}>
                  {user.role === "student" && "👨‍🎓"}
                  {user.role === "teacher" && "👨‍🏫"}
                  {user.role === "admin" && "👨‍💼"}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                
                <span className={`verification-tag ${user.isVerified ? "verified" : "unverified"}`}>
                  {user.isVerified ? "✓ Verified" : "○ Pending"}
                </span>
                
                <span className={`status-tag status-${user.status}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>

            <button className="edit-profile-btn" onClick={() => setShowEditForm(true)}>
              <span>✎</span> Edit Profile
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span>ℹ️</span> Overview
          </button>
          {user.role === "student" && (
            <button
              className={`tab-btn ${activeTab === "student" ? "active" : ""}`}
              onClick={() => setActiveTab("student")}
            >
              <span>📚</span> Student Info
            </button>
          )}
          {user.role === "teacher" && (
            <button
              className={`tab-btn ${activeTab === "teacher" ? "active" : ""}`}
              onClick={() => setActiveTab("teacher")}
            >
              <span>👨‍🏫</span> Teacher Info
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="tab-panel">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">📱</span>
                    <h3>Phone Number</h3>
                  </div>
                  <p className="info-value">{user.phone || "Not provided"}</p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">📅</span>
                    <h3>Member Since</h3>
                  </div>
                  <p className="info-value">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">✅</span>
                    <h3>Verification</h3>
                  </div>
                  <p className="info-value">
                    {user.isVerified ? (
                      <span className="status-good">Verified</span>
                    ) : (
                      <span className="status-warning">Pending</span>
                    )}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🔐</span>
                    <h3>Account Status</h3>
                  </div>
                  <p className="info-value">
                    <span className={`status-badge status-${user.status}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student Info Tab */}
          {activeTab === "student" && user.role === "student" && (
            <div className="tab-panel">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🎓</span>
                    <h3>Class</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.class || "Not specified"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🎯</span>
                    <h3>Learning Goals</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.goals || "Not specified"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🧠</span>
                    <h3>Learning Style</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.learningStyle || "Not specified"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🌐</span>
                    <h3>Preferred Language</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.preferredLanguage || "English"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">📍</span>
                    <h3>State</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.state || "Not specified"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🗺️</span>
                    <h3>District</h3>
                  </div>
                  <p className="info-value">
                    {user.studentProfile?.district || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Info Tab */}
          {activeTab === "teacher" && user.role === "teacher" && (
            <div className="tab-panel">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">🎓</span>
                    <h3>Qualification</h3>
                  </div>
                  <p className="info-value">
                    {user.teacherProfile?.qualification || "Not specified"}
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">⏱️</span>
                    <h3>Experience</h3>
                  </div>
                  <p className="info-value">
                    {user.teacherProfile?.experience || 0} years
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">⭐</span>
                    <h3>Rating</h3>
                  </div>
                  <p className="info-value">
                    <span className="rating">
                      {(user.teacherProfile?.rating || 0).toFixed(1)} / 5.0
                    </span>
                  </p>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icon">📚</span>
                    <h3>Courses Created</h3>
                  </div>
                  <p className="info-value">
                    {user.teacherProfile?.coursesCreated || 0}
                  </p>
                </div>

                {user.teacherProfile?.bio && (
                  <div className="info-card full-width">
                    <div className="info-header">
                      <span className="info-icon">📝</span>
                      <h3>Bio</h3>
                    </div>
                    <p className="info-value bio-text">{user.teacherProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Your Profile</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="profile-form">
              {/* Basic Section */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={editData.name || ""}
                    onChange={handleEditChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Student Section */}
              {editData.role === "student" && (
                <div className="form-section">
                  <h3 className="section-title">Student Profile</h3>
                  
                  <div className="form-group">
                    <label htmlFor="class">Class/Grade</label>
                    <input
                      id="class"
                      type="text"
                      name="class"
                      value={editData.studentProfile?.class || ""}
                      onChange={handleStudentProfileChange}
                      placeholder="e.g., 10th Grade"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="goals">Learning Goals</label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={editData.studentProfile?.goals || ""}
                      onChange={handleStudentProfileChange}
                      placeholder="What do you want to achieve?"
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="learningStyle">Learning Style</label>
                      <select
                        id="learningStyle"
                        name="learningStyle"
                        value={editData.studentProfile?.learningStyle || ""}
                        onChange={handleStudentProfileChange}
                      >
                        <option value="">Select learning style</option>
                        <option value="Visual">Visual</option>
                        <option value="Auditory">Auditory</option>
                        <option value="Reading/Writing">Reading/Writing</option>
                        <option value="Kinesthetic">Kinesthetic</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="preferredLanguage">Preferred Language</label>
                      <select
                        id="preferredLanguage"
                        name="preferredLanguage"
                        value={editData.studentProfile?.preferredLanguage || "English"}
                        onChange={handleStudentProfileChange}
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Section */}
              {editData.role === "teacher" && (
                <div className="form-section">
                  <h3 className="section-title">Teacher Profile</h3>
                  
                  <div className="form-group">
                    <label htmlFor="qualification">Qualification</label>
                    <input
                      id="qualification"
                      type="text"
                      name="qualification"
                      value={editData.teacherProfile?.qualification || ""}
                      onChange={handleTeacherProfileChange}
                      placeholder="e.g., B.Tech in Computer Science"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="experience">Experience (Years)</label>
                      <input
                        id="experience"
                        type="number"
                        name="experience"
                        value={editData.teacherProfile?.experience || ""}
                        onChange={handleTeacherProfileChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={editData.teacherProfile?.bio || ""}
                      onChange={handleTeacherProfileChange}
                      placeholder="Tell students about yourself..."
                      rows="4"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? "⏳ Saving..." : "✓ Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditData(user);
                  }}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
