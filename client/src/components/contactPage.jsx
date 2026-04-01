import "./contact.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import WhatsAppFloat from "./WhatsAppFloat";
import { useState } from "react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    const fieldName = id === "phone" ? "phoneNumber" : id === "message" ? "message" : id;
    setFormData({
      ...formData,
      [fieldName]: value,
    });
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: "",
      });
    }
  };

  // Validate email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate phone
  const isValidPhone = (phone) => {
    if (!phone) return true; // Phone is optional
    return /^(?:\+91|0)?[8-9]\d{9}$/.test(phone.replace(/\s/g, ""));
  };

  // Validate name
  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!isValidName(formData.fullName)) {
      newErrors.fullName = "Please enter a valid name";
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phoneNumber && !isValidPhone(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }

    if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fix the errors above");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://lmsproject-8suc.onrender.com"}/api/contact`,
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
        throw new Error(data.message || "Failed to send message");
      }

      setSuccess(true);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        subject: "",
        message: "",
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-page">

      {/* ===== HERO SECTION ===== */}
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>We are here to help you. Reach out anytime.</p>
      </div>

      {/* ===== MAIN SECTION ===== */}
      <div className="contact-container">

        {/* LEFT SIDE - CONTACT INFO */}
        <div className="contact-info">

          <div className="info-card">
            <FaPhoneAlt className="info-icon phone" />
            <div>
              <h4>Phone Number</h4>
              <p>+91 6262646779</p>
              <span>Mon-Sat: 9 AM - 9 PM</span>
            </div>
          </div>

          <div className="info-card">
            <FaEnvelope className="info-icon email" />
            <div>
              <h4>Email Address</h4>
              <p>support@navodayacoaching.com</p>
              <span>We respond within 24 hours</span>
            </div>
          </div>

          <div className="info-card">
            <FaMapMarkerAlt className="info-icon location" />
            <div>
              <h4>Office Address</h4>
              <p>
                balaji Ranker coaching in  <br />
                front of sahu marriage garden<br />
                seminari road ashta 
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-box">
            <div>
              <h2>12,000+</h2>
              <p>Students Enrolled</p>
            </div>
            <div>
              <h2>95%</h2>
              <p>Success Rate</p>
            </div>
            <div>
              <h2>8+</h2>
              <p>Years Experience</p>
            </div>
            <div>
              <h2>50+</h2>
              <p>Expert Faculty</p>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="contact-form">

          <h3>Send Your Message</h3>

          {/* Success Message */}
          {success && (
            <div className="contact-success-message">
              <FaCheckCircle className="success-icon" />
              <div>
                <h4>Message Sent Successfully!</h4>
                <p>We'll get back to you within 24 hours. Thank you!</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="contact-error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "input-error" : ""}
                disabled={loading}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={errors.phoneNumber ? "input-error" : ""}
                disabled={loading}
              />
              {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                className={errors.subject ? "input-error" : ""}
                disabled={loading}
              />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                placeholder="Write your message..."
                rows="4"
                value={formData.message}
                onChange={handleChange}
                className={errors.message ? "input-error" : ""}
                disabled={loading}
              />
              {errors.message && <span className="field-error">{errors.message}</span>}
            </div>

            <button className="send-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="contact-spinner"></span>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>

        </div>
      </div>

      {/* ===== MAP SECTION ===== */}
      <div className="map-section">
        <h1>Our Location</h1>
        <div className="map-container">
          <iframe
            title="map"
            src="https://maps.google.com/maps?q=Pokaran,+Rajasthan&t=&z=13&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsAppFloat />

    </section>
  );
};

export default ContactPage;