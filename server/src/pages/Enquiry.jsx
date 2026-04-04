import React, { useState } from "react";
import "./Enquiry.css";
import { FaPhone, FaBook, FaCity, FaCheckCircle } from "react-icons/fa";

const EnquiryForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    course: "NEET",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const courses = [
    { value: "NEET", label: "NEET" },
    { value: "JEE", label: "JEE" },
    { value: "Class 10", label: "Class 10" },
    { value: "Class 11", label: "Class 11" },
    { value: "Class 12", label: "Class 12" },
    { value: "Other", label: "Other" },
  ];

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Validate phone number
  const isValidPhone = (phone) => {
    const phoneRegex = /^(?:\+91|0)?[8-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Validate name
  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!isValidName(formData.fullName)) {
      newErrors.fullName = "Please enter a valid name (letters only)";
    }

    if (!isValidPhone(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      setError("Please fix the errors above");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://lmsproject1-cuzs.onrender.com"}/api/enquiry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Server validation errors:", data);
        // If there are field-specific errors, show them
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || "Failed to submit enquiry");
      }

      // Success
      setSuccess(true);
      setFormData({
        fullName: "",
        phoneNumber: "",
        course: "Other",
        city: "",
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enquiry-form-wrapper">
      <div className="enquiry-form-container">
        {/* Left side - Info */}
        <div className="enquiry-left">
          <h2 className="enquiry-title">
            Get Free Counseling
            <br />
            <span>Choose Your Path to Success</span>
          </h2>
          <p className="enquiry-subtitle">
            Join thousands of successful students. Our counselors will help you
            choose the right course and guide your learning journey.
          </p>

          <div className="enquiry-benefits">
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Free Career Counseling</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Personalized Learning Path</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Expert Guidance</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>100% Free Consultation</span>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="enquiry-right">
          <form onSubmit={handleSubmit} className="enquiry-form">
            {/* Success Message */}
            {success && (
              <div className="success-message">
                <FaCheckCircle className="success-icon" />
                <div>
                  <h4>Thank You!</h4>
                  <p>Our team will contact you shortly. Prepare to succeed! 🎓</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Full Name Field */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "input-error" : ""}
                disabled={loading}
              />
              {errors.fullName && (
                <span className="field-error">{errors.fullName}</span>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="form-group">
              <label htmlFor="phoneNumber">
                <FaPhone className="field-icon" />
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                placeholder="10-digit mobile number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={errors.phoneNumber ? "input-error" : ""}
                disabled={loading}
              />
              {errors.phoneNumber && (
                <span className="field-error">{errors.phoneNumber}</span>
              )}
            </div>

            {/* Course Field */}
            <div className="form-group">
              <label htmlFor="course">
                <FaBook className="field-icon" />
                Select Course *
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                disabled={loading}
              >
                {courses.map((course) => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City Field */}
            <div className="form-group">
              <label htmlFor="city">
                <FaCity className="field-icon" />
                City (Optional)
              </label>
              <input
                id="city"
                type="text"
                name="city"
                placeholder="Your city"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="enquiry-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                "Get Free Counseling"
              )}
            </button>

            {/* Terms and Conditions */}
            <p className="form-terms">
              We respect your privacy. Your information is safe with us.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;
