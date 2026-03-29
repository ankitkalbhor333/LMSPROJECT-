import React from "react";
import { resolveInstructorName } from "../../utils/courseIdentity";
import "./OrderSummary.css";

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

const resolveCategory = (course, providedName) => {
  const fromProp = readCategoryValue(providedName);
  if (fromProp) {
    return fromProp;
  }

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

function OrderSummary({ course, instructorName, categoryName }) {
  const discountPercentage = 0; // Can be dynamic
  const discount = (course.price * discountPercentage) / 100;
  const tax = (course.price * 18) / 100; // 18% GST
  const total = course.price;
  const fromProp = resolveInstructorName(String(instructorName || "").trim(), "");
  const displayInstructorName = fromProp || resolveInstructorName(course, "Expert Mentor");
  const displayCategory = resolveCategory(course, categoryName);

  return (
    <div className="order-summary">
      <h3 className="summary-title">Order Summary</h3>

      {/* Items */}
      <div className="summary-item">
        <div className="item-details">
          <p className="item-name">{course.name}</p>
          <span className="item-category">{displayCategory}</span>
          <p className="item-instructor">Instructor: {displayInstructorName}</p>
        </div>
        <p className="item-price">₹{course.price.toLocaleString()}</p>
      </div>

      {/* Divider */}
      <div className="summary-divider"></div>

      {/* Pricing Breakdown */}
      <div className="summary-breakdown">
        <div className="breakdown-row">
          <span>Subtotal</span>
          <span>₹{course.price.toLocaleString()}</span>
        </div>

        {discountPercentage > 0 && (
          <div className="breakdown-row discount">
            <span>Discount ({discountPercentage}%)</span>
            <span>-₹{discount.toLocaleString()}</span>
          </div>
        )}

        <div className="breakdown-row">
          
          <span> Note :-18% GST already included which is paid to the Government</span>
        </div>
      </div>

      {/* Divider */}
      <div className="summary-total">
        <span>Tax</span>
        <span className="total-price">     ₹{Math.round(tax).toLocaleString()}</span>
      </div>

      {/* Total */}
      <div className="summary-total">
        <span>Total Amount</span>
        <span className="total-price">₹{Math.round(total).toLocaleString()}</span>
      </div>

      {/* Features */}
      <div className="summary-features">
        <h4>What's Included:</h4>
        <ul className="features-list">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Lifetime Access</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Certificate of Completion</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>24/7 Student Support</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Money-back Guarantee</span>
          </li>
        </ul>
      </div>

      {/* Trust Badges */}
      <div className="trust-badges">
        <div className="badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Secure Payment</span>
        </div>
        <div className="badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <span>30 Days Money-back</span>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
