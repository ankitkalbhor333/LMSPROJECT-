import React, { useState } from "react";
import "./PaymentForm.css";

function PaymentForm({ orderData, course, onSuccess, onError, loading, razorpayReady }) {
  const [selectedMethod, setSelectedMethod] = useState("razorpay");
  const [processing, setProcessing] = useState(false);

  const handleRazorpayPayment = () => {
    try {
      if (!razorpayReady || typeof window === "undefined" || !window.Razorpay) {
        onError({
          message:
            "Payment gateway is still loading. Please wait a moment and try again.",
        });
        return;
      }

      setProcessing(true);

      const studentName = localStorage.getItem("name") || "Student";
      const studentEmail = localStorage.getItem("email") || "";
      const studentPhone = localStorage.getItem("phone") || "";
      const razorpayKeyId =
        orderData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "";

      if (!razorpayKeyId) {
        setProcessing(false);
        onError({
          message:
            "Razorpay key is not configured. Please contact support.",
        });
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BR SaiNa Coaching",
        description: `Course: ${course.name}`,
        order_id: orderData.orderId,

        handler: function (response) {
          setProcessing(false);
          onSuccess(response);
        },

        prefill: {
          name: studentName,
          email: studentEmail,
          contact: studentPhone,
        },

        notes: {
          courseId: course._id,
          courseName: course.name,
        },

        theme: {
          color: "#667eea",
        },

        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setProcessing(false);
        onError({
          message: `Payment failed: ${response.error.description}`,
        });
      });

      rzp.open();
    } catch (error) {
      setProcessing(false);
      onError(error);
    }
  };

  return (
    <div className="payment-form">
      {/* Payment Methods */}
      <div className="payment-methods">
        <h4 className="methods-title">Select Payment Method</h4>

        <label className="method-option">
          <input
            type="radio"
            name="paymentMethod"
            value="razorpay"
            checked={selectedMethod === "razorpay"}
            onChange={(e) => setSelectedMethod(e.target.value)}
            disabled={processing || loading}
          />
          <div className="method-content">
            <div className="method-header">
              <span className="method-name">Razorpay</span>
              <span className="badge-popular">Popular</span>
            </div>
            <p className="method-description">
              Pay using Credit/Debit Card, UPI, Net Banking, or Wallets
            </p>
          </div>
        </label>

        <label className="method-option">
          <input
            type="radio"
            name="paymentMethod"
            value="upi"
            checked={selectedMethod === "upi"}
            onChange={(e) => setSelectedMethod(e.target.value)}
            disabled={true} // Coming soon
          />
          <div className="method-content">
            <div className="method-header">
              <span className="method-name">UPI Direct</span>
              <span className="badge-soon">Coming Soon</span>
            </div>
            <p className="method-description">Pay directly from your UPI app</p>
          </div>
        </label>

        <label className="method-option">
          <input
            type="radio"
            name="paymentMethod"
            value="bank"
            checked={selectedMethod === "bank"}
            onChange={(e) => setSelectedMethod(e.target.value)}
            disabled={true} // Coming soon
          />
          <div className="method-content">
            <div className="method-header">
              <span className="method-name">Bank Transfer</span>
              <span className="badge-soon">Coming Soon</span>
            </div>
            <p className="method-description">Direct bank transfer option</p>
          </div>
        </label>
      </div>

      {/* Payment Details */}
      <div className="payment-details">
        <div className="detail-row">
          <span className="detail-label">Order ID:</span>
          <span className="detail-value font-mono">{orderData.orderId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">₹{(orderData.amount / 100).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Currency:</span>
          <span className="detail-value">{orderData.currency.toUpperCase()}</span>
        </div>
      </div>

      {/* Security Info */}
      <div className="security-info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <div>
          <p className="security-title">Your payment is secure</p>
          <p className="security-text">
            We use industry-standard encryption to protect your payment information
          </p>
        </div>
      </div>

      {/* Pay Button */}
      <button
        className="btn-pay"
        onClick={handleRazorpayPayment}
        disabled={processing || loading || !razorpayReady || selectedMethod !== "razorpay"}
      >
        {processing || loading || !razorpayReady ? (
          <>
            <span className="spinner-small"></span>
            {!razorpayReady ? "Loading payment gateway..." : "Processing..."}
          </>
        ) : (
          <>
            Pay ₹{(orderData.amount / 100).toLocaleString()}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </>
        )}
      </button>

      {/* Terms */}
      <p className="payment-terms">
        By clicking "Pay", you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

export default PaymentForm;
