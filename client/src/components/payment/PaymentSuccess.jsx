import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PaymentSuccess.css";

const sanitizeFileName = (value) =>
  String(value || "invoice")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, course } = location.state || {};
  const [countdown, setCountdown] = useState(10);

  const handleDownloadInvoice = () => {
    if (!orderId || !course) {
      return;
    }

    const invoiceDate = new Date();
    const studentName = localStorage.getItem("name") || "Student";
    const studentPhone = localStorage.getItem("phone") || "Not Available";
    const courseName = String(course.name || "Course");
    const amountPaid = Number(course.price) || 0;

    const invoiceContent = [
      "BR SaiNa Coaching",
      "Payment Invoice",
      "==============================",
      `Invoice Date: ${invoiceDate.toLocaleString()}`,
      `Order ID: ${orderId}`,
      `Student Name: ${studentName}`,
      `Student Phone: ${studentPhone}`,
      "",
      "Course Details",
      "------------------------------",
      `Course Name: ${courseName}`,
      `Amount Paid: INR ${amountPaid.toLocaleString("en-IN")}`,
      "",
      "Payment Status: Successful",
      "Gateway: Razorpay",
      "",
      "Thank you for your purchase!",
      "For support: support@brsaina.com",
    ].join("\n");

    const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeCourseName = sanitizeFileName(courseName);

    link.href = blobUrl;
    link.download = `invoice-${safeCourseName || "course"}-${String(orderId).slice(-8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    if (!orderId || !course) {
      navigate("/");
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/mybatches");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, course, navigate]);

  if (!orderId || !course) {
    return null;
  }

  return (
    <div className="payment-success-page">
      {/* Confetti background element */}
      <div className="confetti-container"></div>

      <div className="success-container">
        {/* Success Animation */}
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="success-title">Payment Successful!</h1>
        <p className="success-message">
          Congratulations! Your enrollment to <strong>{course.name}</strong> is complete.
        </p>

        {/* Order Details */}
        <div className="order-details">
          <div className="detail-card">
            <h3>Order Confirmation</h3>
            <div className="detail-item">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">{orderId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Course:</span>
              <span className="detail-value">{course.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount Paid:</span>
              <span className="detail-value amount">₹{course.price.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="detail-card">
            <h3>What's Next?</h3>
            <ul className="next-steps">
              <li>✓ Course access is now enabled</li>
              <li>✓ Your enrollment is confirmed successfully</li>
              <li>✓ Access all course materials on your dashboard</li>
              <li>✓ Start learning at your own pace</li>
            </ul>
          </div>
        </div>

        {/* Download Invoice */}
        <div className="invoice-section">
          <button className="btn-secondary" onClick={handleDownloadInvoice} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Invoice
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-primary btn-large"
            onClick={() => navigate("/student/student-dashboard")}
          >
            Go to Dashboard
          </button>
          <button
            className="btn-outline btn-large"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>

        {/* Auto-redirect info */}
        <p className="redirect-info">
          Redirecting to dashboard in <span className="countdown">{countdown}</span>s...
        </p>

        {/* Support section */}
        <div className="support-section">
          <p>Need help?</p>
          <a href="mailto:support@brsaina.com" className="support-link">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
