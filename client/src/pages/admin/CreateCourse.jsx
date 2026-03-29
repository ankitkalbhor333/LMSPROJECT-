import { useState, useEffect } from "react";
import API from "../../utils/api";
import "./CreateCourse.css";

function CreateCourse() {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    discountPrice: "",
    duration: "",
    category: "",
    subject: "",
    level: "beginner",
    language: "English",
    previewVideo: "",
    certificateAvailable: true,
    refundDays: "30",
    rating: "0",
    enrollmentCount: "0",
  });

  const [learningPoints, setLearningPoints] = useState([""]);
  const [features, setFeatures] = useState([""]);

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const resolvedTeacherId =
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    "";

  // Get current user info on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setUserLoading(true);
        setUserError(null);
        const token = localStorage.getItem("token");

        if (!token) {
          setUserError("No authentication token found. Please log in again.");
          setUserLoading(false);
          return;
        }

        // Get user from profile endpoint
        try {
          const response = await API.get("/user/profile");
          console.log("✅ User fetched successfully:", response.data);
          setCurrentUser(response.data);
        } catch (authError) {
          console.error("❌ /user/profile failed:", authError);
          setUserError("Failed to fetch user information. Please try again.");
        }
      } finally {
        setUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const updateStringList = (setter, index, value) => {
    setter((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addStringListItem = (setter) => {
    setter((prev) => [...prev, ""]);
  };

  const removeStringListItem = (setter, index) => {
    setter((prev) => {
      if (prev.length <= 1) {
        return [""];
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage("Please select a valid image file");
        setMessageType("error");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Image size must be less than 5MB");
        setMessageType("error");
        return;
      }

      setThumbnail(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.price) {
      setMessage("Please fill all required fields");
      setMessageType("error");
      return;
    }

    const cleanedLearningPoints = learningPoints
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const cleanedFeatures = features
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (!cleanedLearningPoints.length) {
      setMessage("Add at least one learning point");
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No authentication token found. Please log in again.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // Create FormData to handle file upload
      const uploadData = new FormData();
      uploadData.append("title", formData.title.trim());
      uploadData.append("subtitle", formData.subtitle.trim());
      uploadData.append("description", formData.description.trim());
      uploadData.append("price", formData.price);
      uploadData.append("discountPrice", formData.discountPrice);
      uploadData.append("duration", formData.duration.trim());
      uploadData.append("category", formData.category.trim());
      uploadData.append("subject", formData.subject.trim());
      uploadData.append("level", formData.level);
      uploadData.append("language", formData.language.trim());
      uploadData.append("previewVideo", formData.previewVideo.trim());
      uploadData.append("certificateAvailable", String(formData.certificateAvailable));
      uploadData.append("refundDays", formData.refundDays || "0");
      uploadData.append("rating", formData.rating || "0");
      uploadData.append("enrollmentCount", formData.enrollmentCount || "0");
      uploadData.append("learningPoints", JSON.stringify(cleanedLearningPoints));
      uploadData.append("features", JSON.stringify(cleanedFeatures));

      // Teacher is resolved server-side from token as fallback, but send it when available.
      if (resolvedTeacherId) {
        uploadData.append("teacher", resolvedTeacherId);
      }

      if (thumbnail) {
        uploadData.append("thumbnail", thumbnail);
      }

      console.log("📤 Submitting course with teacher:", resolvedTeacherId || "token-user");
      await API.post("/courses/create", uploadData);

      setMessage("Course created successfully! ✅");
      setMessageType("success");

      setFormData({
        title: "",
        subtitle: "",
        description: "",
        price: "",
        discountPrice: "",
        duration: "",
        category: "",
        subject: "",
        level: "beginner",
        language: "English",
        previewVideo: "",
        certificateAvailable: true,
        refundDays: "30",
        rating: "0",
        enrollmentCount: "0",
      });
      setLearningPoints([""]);
      setFeatures([""]);
      setThumbnail(null);
      setThumbnailPreview(null);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      setMessage(`Failed to create course: ${errorMsg} ❌`);
      setMessageType("error");
      console.error("❌ Error details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">➕ Create New Course</h1>
          <p className="admin-subtitle">Add a new course to your platform</p>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`alert alert-${messageType}`} role="alert">
          <span>{message}</span>
          <button className="close-btn" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Form Container */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="course-form">
          {/* Section 1: Basic Information */}
          <div className="form-section">
            <h3 className="section-title">📋 Course Information</h3>

            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input
                type="text"
                className="form-input"
                name="title"
                placeholder="e.g., Advanced JavaScript Mastery"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-input"
                name="subtitle"
                placeholder="e.g., Complete roadmap for Navodaya & Sainik success"
                value={formData.subtitle}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                name="description"
                rows="5"
                placeholder="Describe what students will learn in this course..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Thumbnail</label>
              <div className="thumbnail-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="form-input"
                  id="thumbnail-input"
                />
                {thumbnailPreview && (
                  <div className="thumbnail-preview">
                    <img src={thumbnailPreview} alt="Course Thumbnail Preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnail(null);
                        setThumbnailPreview(null);
                      }}
                      className="btn-remove-thumbnail"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <small className="form-hint">Supported formats: JPEG, PNG, WebP (Max 5MB)</small>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Instructor</label>
                {userError ? (
                  <div style={{
                    padding: "10px",
                    backgroundColor: "#fff6e5",
                    border: "1px solid #f2d08a",
                    borderRadius: "4px",
                    color: "#9a6b00"
                  }}>
                    ⚠️ {userError}. Course will use the currently authenticated account.
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={
                      userLoading
                        ? "Loading teacher info..."
                        : (currentUser?.name || currentUser?.user?.name || "Authenticated user")
                    }
                    disabled
                    title="Course will be assigned to the current logged-in user"
                  />
                )}
                <small className="form-hint">
                  {userLoading ? "Fetching your information..." : "Automatically assigned using login session"}
                </small>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  name="category"
                  placeholder="e.g., Programming"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  name="subject"
                  placeholder="e.g., Mathematics"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group flex-1" />
            </div>
          </div>

          {/* Section 2: Course Details */}
          <div className="form-section">
            <h3 className="section-title">💰 Course Pricing & Duration</h3>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  name="price"
                  placeholder="e.g., 4999"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Discount Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  name="discountPrice"
                  placeholder="e.g., 3999"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-input"
                  name="duration"
                  placeholder="e.g., 12 weeks"
                  value={formData.duration}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Level</label>
                <select
                  className="form-input"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Language</label>
                <input
                  type="text"
                  className="form-input"
                  name="language"
                  placeholder="e.g., Hindi"
                  value={formData.language}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Refund Days</label>
                <input
                  type="number"
                  className="form-input"
                  name="refundDays"
                  placeholder="30"
                  value={formData.refundDays}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Rating (0-5)</label>
                <input
                  type="number"
                  className="form-input"
                  name="rating"
                  placeholder="0"
                  value={formData.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Enrollment Count</label>
                <input
                  type="number"
                  className="form-input"
                  name="enrollmentCount"
                  placeholder="0"
                  value={formData.enrollmentCount}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Preview Video URL</label>
                <input
                  type="text"
                  className="form-input"
                  name="previewVideo"
                  placeholder="https://... or uploads/course-videos/preview.mp4"
                  value={formData.previewVideo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group flex-1 form-checkbox-group">
                <label className="form-label">Certificate</label>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    name="certificateAvailable"
                    checked={formData.certificateAvailable}
                    onChange={handleChange}
                  />
                  <span>Certificate available</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Learning & Features */}
          <div className="form-section">
            <h3 className="section-title">🎯 Learning Outcomes</h3>

            <div className="form-group">
              <label className="form-label">What You Will Learn *</label>
              <div className="dynamic-list">
                {learningPoints.map((point, index) => (
                  <div className="list-item-row" key={`learning-point-${index}`}>
                    <input
                      type="text"
                      className="form-input"
                      value={point}
                      onChange={(e) => updateStringList(setLearningPoints, index, e.target.value)}
                      placeholder={`Learning point ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="btn-remove-inline"
                      onClick={() => removeStringListItem(setLearningPoints, index)}
                      title="Remove learning point"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-add-inline"
                onClick={() => addStringListItem(setLearningPoints)}
              >
                + Add Learning Point
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Feature Tags</label>
              <div className="dynamic-list">
                {features.map((feature, index) => (
                  <div className="list-item-row" key={`feature-${index}`}>
                    <input
                      type="text"
                      className="form-input"
                      value={feature}
                      onChange={(e) => updateStringList(setFeatures, index, e.target.value)}
                      placeholder={`Feature ${index + 1} (e.g., DSA, Aptitude)`}
                    />
                    <button
                      type="button"
                      className="btn-remove-inline"
                      onClick={() => removeStringListItem(setFeatures, index)}
                      title="Remove feature"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-add-inline"
                onClick={() => addStringListItem(setFeatures)}
              >
                + Add Feature
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">📚 Course Curriculum</h3>
            <p className="form-hint">
              Curriculum (subject, unit, lecture hierarchy) is managed from Course Builder using the dedicated
              content route. Create the course here first, then add curriculum in Course Builder.
            </p>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              title={
                loading ? "Creating course..." : "Create Course"
              }
            >
              {loading ? "Creating Course..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;