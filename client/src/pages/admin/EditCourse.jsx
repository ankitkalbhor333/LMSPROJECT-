import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import "./EditCourse.css";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    instructor: "",
    category: "",
    thumbnail: "",
  });

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setFormData(res.data);
      if (res.data.thumbnail) {
        setThumbnailPreview(res.data.thumbnail);
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      setLoading(true);

      // Create FormData to handle file upload
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("price", formData.price);
      uploadData.append("duration", formData.duration);
      uploadData.append("instructor", formData.instructor);
      uploadData.append("category", formData.category);
      
      if (thumbnail) {
        uploadData.append("thumbnail", thumbnail);
      }

      await API.put(`/courses/${id}`, uploadData);
      
      setMessage("Course updated successfully! ✅");
      setMessageType("success");

      setTimeout(() => {
        navigate("/admin/courses");
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      setMessage(`Failed to update course: ${errorMsg} ❌`);
      setMessageType("error");
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <h4>Loading course...</h4>;

  return (
    <div className="edit-course-container">
      <h2>Edit Course</h2>

      {/* Alert Message */}
      {message && (
        <div className={`alert alert-${messageType}`} role="alert">
          <span>{message}</span>
          <button className="close-btn" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">

        <div className="mb-3">
          <label>Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label>Description</label>
          <textarea
            className="form-control"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>Course Thumbnail</label>
          <div className="thumbnail-upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="form-control"
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
          <small className="form-text text-muted">Supported formats: JPEG, PNG, WebP (Max 5MB)</small>
        </div>

        <div className="mb-3">
          <label>Price</label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label>Duration</label>
          <input
            type="text"
            className="form-control"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>Instructor</label>
          <input
            type="text"
            className="form-control"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label>Category</label>
          <input
            type="text"
            className="form-control"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? "Updating..." : "Update Course"}
        </button>

      </form>
    </div>
  );
}

export default EditCourse;