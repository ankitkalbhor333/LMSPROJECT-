import { useState } from "react";
import API from "../../utils/api";
import "./FreeMatUpload.css";

const UploadNotes = () => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    chapter: "",
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("File size must be less than 50MB");
        return;
      }
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      setFormData({
        ...formData,
        file: file,
      });
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.title || !formData.subject || !formData.chapter) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.file) {
      setError("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("title", formData.title);
      uploadFormData.append("subject", formData.subject);
      uploadFormData.append("chapter", formData.chapter);
      uploadFormData.append("file", formData.file);

      const response = await API.post("/notes", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Notes uploaded successfully!");
      setFormData({
        title: "",
        subject: "",
        chapter: "",
        file: null,
      });

      // Reset file input
      document.getElementById("notes-file-input").value = "";

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error uploading notes:", err);
      setError(err.response?.data?.message || "Error uploading notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>Upload Notes</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Notes Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Number System Notes"
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
                placeholder="e.g., Mathematics"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Chapter/Topic *</label>
            <input
              type="text"
              name="chapter"
              value={formData.chapter}
              onChange={handleInputChange}
              placeholder="e.g., Chapter 1: Basics"
              required
            />
          </div>

          <div className="form-group">
            <label>PDF File * (Max 50MB)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="notes-file-input"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              <span className="file-name">
                {formData.file ? formData.file.name : "Choose PDF file..."}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Uploading..." : "Upload Notes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadNotes;