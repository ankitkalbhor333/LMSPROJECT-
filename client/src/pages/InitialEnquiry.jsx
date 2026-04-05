import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import axios from "axios";
import "./InitialEnquiry.css";
import { FaBook, FaCheckCircle } from "react-icons/fa";

const InitialEnquiry = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    course: "",
    city: "",
    message: "",
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);

  const apiUrl =
    import.meta.env.VITE_API_URL || "https://lmsproject1-cuzs.onrender.com";

  // Fetch available courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setFetchingCourses(true);
        const response = await axios.get(`${apiUrl}/api/courses/list`);

        if (response.data?.success && Array.isArray(response.data.data)) {
          setCourses(response.data.data);
        } else if (Array.isArray(response.data)) {
          // Handle non-standard response format
          setCourses(
            response.data.map((course) => ({
              id: course._id,
              title: course.title,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses. Please refresh the page.");
      } finally {
        setFetchingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }

    if (formData.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long");
      return false;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      toast.error("Name can only contain letters and spaces");
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    const normalizedPhone = formData.phoneNumber.replace(/\D/g, "");
    if (!/(^(\+91|0)?[6-9]\d{9}$)|(^[6-9]\d{9}$)/.test(normalizedPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }

    if (formData.city.trim().length < 2) {
      toast.error("City must be at least 2 characters long");
      return false;
    }

    if (!formData.course.trim()) {
      toast.error("Please select a course");
      return false;
    }

    if (!formData.message.trim()) {
      toast.error("Please write a message");
      return false;
    }

    if (formData.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters long");
      return false;
    }

    if (formData.message.trim().length > 500) {
      toast.error("Message cannot exceed 500 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/api/enquiry/initial-submission`,
        {
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          course: formData.course.trim(),
          city: formData.city.trim(),
          message: formData.message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        setSubmitted(true);
        toast.success(response.data.message || "Enquiry submitted successfully!");

        // Redirect to home or dashboard after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(response.data?.message || "Failed to submit enquiry");
      }
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit enquiry. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="initial-enquiry-container">
        <div className="enquiry-card success-card">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h2>Thank You!</h2>
          <p>Your enquiry has been submitted successfully.</p>
          <p className="success-message">
            We will review your information and get back to you soon.
          </p>
          <p className="redirect-message">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="initial-enquiry-container">
      <div className="enquiry-card">
        <div className="enquiry-header">
          <FaBook className="header-icon" />
          <h1>Tell Us About Your Interests</h1>
          <p className="enquiry-subtitle">
            Help us understand what you're looking to learn
          </p>
        </div>

        {fetchingCourses ? (
          <div className="loading-state">
            <p>Loading courses...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="enquiry-form">
            {/* Name and Phone Row */}
            <div className="form-row">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-text">Full Name *</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-control"
                  required
                />
              </div>

              {/* Phone Number Field */}
              <div className="form-group">
                <label htmlFor="phoneNumber">
                  <span className="label-text">Phone Number *</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* City and Course Row */}
            <div className="form-row">
              {/* City Field */}
              <div className="form-group">
                <label htmlFor="city">
                  <span className="label-text">City *</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="form-control"
                  required
                />
              </div>

              {/* Course Selection */}
              <div className="form-group">
                <label htmlFor="course">
                  <span className="label-text">Select a Course *</span>
                </label>
                {courses.length > 0 ? (
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">-- Choose a course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.title}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="no-courses-message">No courses available</p>
                )}
              </div>
            </div>

            {/* Message Field - Full Width */}
            <div className="form-group">
              <label htmlFor="message">
                <span className="label-text">Message *</span>
                <span className="char-count">
                  {formData.message.length}/500
                </span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your goals and interests (minimum 10 characters)"
                className="form-control message-textarea"
                rows="6"
                maxLength="500"
                required
              />
              <small className="form-text-muted">
                Minimum 10 characters, Maximum 500 characters
              </small>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || fetchingCourses}
                style={{
                  opacity: submitting || fetchingCourses ? 0.6 : 1,
                  cursor:
                    submitting || fetchingCourses ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </div>

            <div className="form-note">
              <p>
                <strong>Note:</strong> This form is required to complete your
                registration. You only need to fill it once.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InitialEnquiry;
