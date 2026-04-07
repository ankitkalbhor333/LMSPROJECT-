import React, { useState } from "react";
import "./WhatsAppFloat.css";

function WhatsAppFloat({ batchLink = null, batchName = "" }) {
  const [showMenu, setShowMenu] = useState(false);

  // Default WhatsApp group link
  const defaultGroupLink = "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t";
  
  // Use batch-specific link if provided, otherwise use default
  const whatsappGroupLink = batchLink || defaultGroupLink;
  const whatsappNumber = "8817457938";
  const defaultMessage = "Hello! I want to know more about your courses.";

  const handleWhatsAppClick = (message = defaultMessage) => {
    if (message === "group") {
      window.open(whatsappGroupLink, "_blank");
    } else {
      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
        "_blank"
      );
    }
    setShowMenu(false);
  };

  const quickMessages = [
    { text: "Course Details", message: "Hi! Can you provide course details?" },
    { text: "Pricing", message: "What are the pricing options available?" },
    { text: "Admission", message: "How do I get admission to your courses?" },
    { text: "Schedule", message: "What is the class schedule?" },
  ];

  return (
    <div className={`whatsapp-float-container ${showMenu ? "menu-open" : ""}`}>
      {/* Quick Messages Menu */}
      {showMenu && (
        <div className="whatsapp-menu">
          {quickMessages.map((item, index) => (
            <button
              key={index}
              className="whatsapp-menu-item"
              onClick={() => handleWhatsAppClick(item.message)}
            >
              <span className="menu-text">{item.text}</span>
              <span className="menu-arrow">→</span>
            </button>
          ))}
          <div className="whatsapp-menu-divider"></div>
          <button
            className="whatsapp-menu-item custom"
            onClick={() => handleWhatsAppClick(defaultMessage)}
          >
            <span className="menu-text">Custom Message</span>
            <span className="menu-arrow">→</span>
          </button>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`whatsapp-float-btn ${showMenu ? "active" : ""}`}
        onClick={() => handleWhatsAppClick("group")}
        title={`Join ${batchName ? batchName + " " : ""}WhatsApp group!`}
        aria-label={`Join ${batchName ? batchName + " " : ""}WhatsApp group`}
        data-tooltip={`Join ${batchName ? batchName + " " : ""}WhatsApp group!`}
      >
        <span className="whatsapp-icon">💬</span>
        <span className="whatsapp-float-label">Chat</span>
      </button>

      {/* Badge for notifications */}
      <div className="whatsapp-float-badge">
        <span>24/7</span>
      </div>
    </div>
  );
}

export default WhatsAppFloat;
