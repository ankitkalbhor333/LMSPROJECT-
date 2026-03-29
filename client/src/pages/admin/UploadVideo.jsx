import { useState } from "react";
import API from "../../utils/api";
import "./FreeMatUpload.css";

const UploadVideo = () => {
  const [uploadMode, setUploadMode] = useState("file"); // "file" or "youtube"
  const [formData, setFormData] = useState({
    title: "",
    className: "",
    exam: "",
    subject: "",
    duration: "",
    teacher: "",
    file: null,
  });
  const [youtubeData, setYoutubeData] = useState({
    title: "",
    className: "",
    exam: "",
    subject: "",
    duration: "",
    teacher: "",
    youtubeLink: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Extract video ID from YouTube URL
  const extractYouTubeId = (url) => {
    try {
      if (!url) return null;
      
      const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      const directMatch = url.match(/([a-zA-Z0-9_-]{11})/);
      if (directMatch && directMatch[1]) {
        return directMatch[1];
      }
    } catch (e) {
      console.error("Error extracting YouTube ID:", e);
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleYoutubeInputChange = (e) => {
    const { name, value } = e.target;
    setYoutubeData({
      ...youtubeData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        setError("File size must be less than 500MB");
        return;
      }
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }
      setFormData({
        ...formData,
        file: file,
      });
      setError("");
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.title || !formData.className || !formData.exam || 
        !formData.subject || !formData.teacher) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.file) {
      setError("Please select a video file");
      return;
    }

    try {
      setLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("title", formData.title);
      uploadFormData.append("className", formData.className);
      uploadFormData.append("exam", formData.exam);
      uploadFormData.append("subject", formData.subject);
      uploadFormData.append("duration", formData.duration);
      uploadFormData.append("teacher", formData.teacher);
      uploadFormData.append("file", formData.file);

      const response = await API.post("/videos", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Video uploaded successfully!");
      setFormData({
        title: "",
        className: "",
        exam: "",
        subject: "",
        duration: "",
        teacher: "",
        file: null,
      });

      // Reset file input
      document.getElementById("video-file-input").value = "";

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error uploading video:", err);
      setError(err.response?.data?.message || "Error uploading video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!youtubeData.title || !youtubeData.className || !youtubeData.exam || 
        !youtubeData.subject || !youtubeData.teacher) {
      setError("Please fill in all required fields");
      return;
    }

    if (!youtubeData.youtubeLink.trim()) {
      setError("Please enter YouTube link");
      return;
    }

    if (!youtubeData.youtubeLink.includes('youtube.com') && !youtubeData.youtubeLink.includes('youtu.be')) {
      setError("Please enter a valid YouTube URL (youtube.com or youtu.be)");
      return;
    }

    const videoId = extractYouTubeId(youtubeData.youtubeLink);
    console.log("Extracted YouTube ID:", videoId, "from URL:", youtubeData.youtubeLink);
    
    if (!videoId) {
      setError("Could not extract video ID from YouTube link.\n\nPlease ensure the URL is in one of these formats:\n- https://youtu.be/VIDEO_ID\n- https://youtu.be/VIDEO_ID?si=...\n- https://youtube.com/watch?v=VIDEO_ID");
      return;
    }

    try {
      setLoading(true);

      console.log("Adding YouTube free material video:", {
        title: youtubeData.title,
        className: youtubeData.className,
        exam: youtubeData.exam,
        subject: youtubeData.subject,
        teacher: youtubeData.teacher,
        youtubeLink: youtubeData.youtubeLink,
      });

      const res = await API.post("/videos/create-youtube", {
        title: youtubeData.title,
        className: youtubeData.className,
        exam: youtubeData.exam,
        subject: youtubeData.subject,
        duration: youtubeData.duration,
        teacher: youtubeData.teacher,
        youtubeLink: youtubeData.youtubeLink,
      });

      console.log("YouTube free material video added successfully:", res.data);

      setSuccess("YouTube video added to free materials successfully!");
      setYoutubeData({
        title: "",
        className: "",
        exam: "",
        subject: "",
        duration: "",
        teacher: "",
        youtubeLink: "",
      });

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      console.error("Error adding YouTube free material video:", {
        status: err.response?.status,
        message: errorMsg,
        fullError: err
      });
      setError("Failed to add YouTube video:\n\n" + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>Upload Video to Free Materials</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Upload Mode Selector */}
        <div className="mode-selector" style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "20px" }}>
            <input
              type="radio"
              value="file"
              checked={uploadMode === "file"}
              onChange={(e) => setUploadMode(e.target.value)}
            />
            {" "}📁 Upload Video File
          </label>
          <label>
            <input
              type="radio"
              value="youtube"
              checked={uploadMode === "youtube"}
              onChange={(e) => setUploadMode(e.target.value)}
            />
            {" "}🔗 YouTube Link
          </label>
        </div>

        {uploadMode === "file" ? (
          <form onSubmit={handleFileSubmit} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label>Video Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Physics"
                  required
                />
              </div>

              <div className="form-group">
                <label>Class *</label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  placeholder="e.g., Class 10"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Exam *</label>
                <input
                  type="text"
                  name="exam"
                  value={formData.exam}
                  onChange={handleInputChange}
                  placeholder="e.g., JEE, NEET"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Physics, Chemistry"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration (MM:SS)</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 45:30"
                />
              </div>

              <div className="form-group">
                <label>Teacher Name *</label>
                <input
                  type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. Smith"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Video File * (Max 500MB)</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="video-file-input"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                />
                <span className="file-name">
                  {formData.file ? formData.file.name : "Choose video file..."}
                </span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Uploading..." : "Upload Video"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleYoutubeSubmit} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label>Video Title *</label>
                <input
                  type="text"
                  name="title"
                  value={youtubeData.title}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., Introduction to Physics"
                  required
                />
              </div>

              <div className="form-group">
                <label>Class *</label>
                <input
                  type="text"
                  name="className"
                  value={youtubeData.className}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., Class 10"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Exam *</label>
                <input
                  type="text"
                  name="exam"
                  value={youtubeData.exam}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., JEE, NEET"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={youtubeData.subject}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., Physics, Chemistry"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration (MM:SS)</label>
                <input
                  type="text"
                  name="duration"
                  value={youtubeData.duration}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., 45:30"
                />
              </div>

              <div className="form-group">
                <label>Teacher Name *</label>
                <input
                  type="text"
                  name="teacher"
                  value={youtubeData.teacher}
                  onChange={handleYoutubeInputChange}
                  placeholder="e.g., Dr. Smith"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>YouTube Link *</label>
              <input
                type="url"
                name="youtubeLink"
                value={youtubeData.youtubeLink}
                onChange={handleYoutubeInputChange}
                placeholder="e.g., https://youtu.be/Q5fXiKhJAu8 or https://youtube.com/watch?v=Q5fXiKhJAu8"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Adding..." : "Add YouTube Video"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadVideo;