import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../utils/api";
import { resolveInstructorName } from "../../utils/courseIdentity";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import OrderSummary from "./OrderSummary";
import PaymentForm from "./PaymentForm";
import "./CheckoutPage.css";

const MONGODB_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const readCategoryValue = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || MONGODB_OBJECT_ID_REGEX.test(normalized)) {
      return "";
    }

    return normalized;
  }

  if (Array.isArray(value)) {
    const firstMatch = value.map(readCategoryValue).find(Boolean);
    return firstMatch || "";
  }

  if (value && typeof value === "object") {
    return (
      readCategoryValue(value.name) ||
      readCategoryValue(value.title) ||
      readCategoryValue(value.label) ||
      readCategoryValue(value.categoryName) ||
      readCategoryValue(value.category)
    );
  }

  return "";
};

const resolveCategory = (course) => {
  if (!course || typeof course !== "object") {
    return "General";
  }

  const fallback =
    readCategoryValue(course.category) ||
    readCategoryValue(course.categoryName) ||
    readCategoryValue(course.courseCategory) ||
    readCategoryValue(course.subject) ||
    readCategoryValue(course.subjectName) ||
    readCategoryValue(course.primaryCategory) ||
    readCategoryValue(course.subjects);

  return fallback || "General";
};

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { course } =  location.state || {};
  const [checkoutCourse, setCheckoutCourse] = useState(course || null);
  const instructorName = resolveInstructorName(checkoutCourse, "Expert Mentor");
  const displayCategory = resolveCategory(checkoutCourse);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [orderData, setOrderData] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Processing

  useEffect(() => {
    setCheckoutCourse(course || null);
  }, [course]);

  // Redirect if no course data
  useEffect(() => {
    if (!checkoutCourse) {
      navigate("/");
      return undefined;
    }

    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayReady(true);
      return undefined;
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [checkoutCourse, navigate]);

  // Fetch latest course details when checkout state has partial data (e.g., missing category)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      const courseId = checkoutCourse?._id || checkoutCourse?.id || "";

      if (!courseId) {
        return;
      }

      const hasCategoryData = Boolean(
        resolveCategory(checkoutCourse) !== "General"
      );

      if (hasCategoryData) {
        return;
      }

      try {
        const response = await API.get(`/courses/${courseId}`);
        const responseData = response?.data;
        const fetchedCourse =
          responseData?.data && typeof responseData.data === "object"
            ? responseData.data
            : responseData?.course && typeof responseData.course === "object"
              ? responseData.course
              : responseData;

        if (!fetchedCourse || typeof fetchedCourse !== "object") {
          return;
        }

        setCheckoutCourse((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            ...fetchedCourse,
            _id: prev._id || prev.id || fetchedCourse._id || fetchedCourse.id,
            id: prev.id || prev._id || fetchedCourse.id || fetchedCourse._id,
            name: prev.name || fetchedCourse.name || fetchedCourse.title || "Course",
            image: prev.image || fetchedCourse.image || fetchedCourse.thumbnail || fetchedCourse.banner || "",
          };
        });
      } catch (fetchError) {
        console.warn("Could not fetch category from course API:", fetchError);
      }
    };

    fetchCourseDetails();
  }, [checkoutCourse?._id, checkoutCourse?.id, checkoutCourse?.category, checkoutCourse?.subject]);

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to continue");
        setLoading(false);
        return;
      }

      // Create order on backend
      const orderResponse = await API.post("/payment/create-order", {
        amount: checkoutCourse.price,
        courseId: checkoutCourse._id || checkoutCourse.id,
      });

      if (!orderResponse.data.success) {
        throw new Error("Failed to create order");
      }

      setOrderData(orderResponse.data);
      setStep(2);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to create order. Please try again.");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setStep(3);
      setLoading(true);

      console.log("💳 Payment response received:", paymentResponse);

      // Verify payment on backend
      const verifyResponse = await API.post("/payment/verify", {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        courseId: checkoutCourse._id || checkoutCourse.id,
        amount: checkoutCourse.price, // Include amount for better tracking
      });

      console.log("✅ Verification response:", verifyResponse.data);

      if (verifyResponse.data.success) {
        // Redirect to success page
        navigate("/payment/success", {
          state: {
            orderId: paymentResponse.razorpay_order_id,
            course: checkoutCourse,
          },
        });
      } else {
        throw new Error(verifyResponse.data.message || "Payment verification failed");
      }
    } catch (err) {
      console.error("❌ Payment error details:", err);
      const errorMessage = err.response?.data?.message || err.message || "Payment verification failed";
      setError(errorMessage);
      setStep(2);
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    setError(error.message || "Payment failed. Please try again.");
    setStep(2);
    setLoading(false);
  };

  if (!checkoutCourse) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <h2>Course information not available</h2>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Progress Bar */}
      <div className="checkout-progress">
        <div className="progress-container">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <div className="step-label">Review</div>
          </div>
          <div className={`progress-line ${step > 1 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <div className="step-label">Payment</div>
          </div>
          <div className={`progress-line ${step > 2 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <div className="step-label">Confirm</div>
          </div>
        </div>
      </div>

      <div className="checkout-container">
        {/* Left Column - Main Content */}
        <div className="checkout-main">
          {/* Header */}
          <div className="checkout-header">
            <button
              className="btn-back"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              ← Back
            </button>
            <h1 className="checkout-title">Secure Checkout</h1>
            <div className="security-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Secure Payment</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <h4>Payment Error</h4>
                <p>{error}</p>
              </div>
              {step === 2 && (
                <button
                  className="btn-retry"
                  onClick={() => setError(null)}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Step 1: Review Order */}
          {step === 1 && (
            <div className="checkout-step">
              <h2 className="step-title">Order Review</h2>
              
              <div className="course-preview">
                {checkoutCourse.image && (
                  <img src={resolveMediaUrl(checkoutCourse.image)} alt={checkoutCourse.name} className="preview-image" />
                )}
                <div className="preview-content">
                  <h3>{checkoutCourse.name}</h3>
                  <p className="course-category-badge">{displayCategory}</p>
                  <p className="course-description">{checkoutCourse.description}</p>
                  <div className="course-meta">
                    <span>🎯 Instructor: {instructorName}</span>
                    <span>⏱️ Duration: {checkoutCourse.duration}</span>
                  </div>
                </div>
              </div>

              <div className="terms-section">
                <label className="checkbox-container">
                  <input type="checkbox" defaultChecked onChange={() => {}} />
                  <span>I agree to the terms and conditions</span>
                </label>
              </div>

              <button
                className="btn-primary btn-large"
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Creating Order...
                  </>
                ) : (
                  "Proceed to Payment →"
                )}
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && orderData && (
            <div className="checkout-step">
              <h2 className="step-title">Payment Method</h2>
              
              <PaymentForm
                orderData={orderData}
                course={checkoutCourse}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                loading={loading}
                razorpayReady={razorpayReady}
              />
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <div className="checkout-step processing">
              <div className="processing-animation">
                <div className="pulse"></div>
                <h3>Processing Payment...</h3>
                <p>Please wait while we confirm your payment</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <aside className="checkout-sidebar">
          <OrderSummary course={checkoutCourse} instructorName={instructorName} categoryName={displayCategory} />
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;
