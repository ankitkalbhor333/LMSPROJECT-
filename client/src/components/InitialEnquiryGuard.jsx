import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import InitialEnquiry from "../pages/InitialEnquiry";

/**
 * Initial Enquiry Guard Component
 * Checks if authenticated user has completed initial enquiry form
 * If not completed, shows the form
 * If completed, redirects to home
 */
const InitialEnquiryGuard = () => {
  const [loading, setLoading] = useState(true);
  const [enquirySubmitted, setEnquirySubmitted] = useState(null);
  const [error, setError] = useState(null);

  const apiUrl =
    import.meta.env.VITE_API_URL || "https://lmsproject1-cuzs.onrender.com";

  useEffect(() => {
    const checkEnquiryStatus = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          // Not authenticated, redirect to login
          setEnquirySubmitted(null);
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${apiUrl}/api/enquiry/initial-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          setEnquirySubmitted(response.data.data.enquirySubmitted);
        }
      } catch (error) {
        console.error("Error checking enquiry status:", error);
        setError("Failed to check enquiry status");
      } finally {
        setLoading(false);
      }
    };

    checkEnquiryStatus();
  }, [apiUrl]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (enquirySubmitted === null) {
    return <Navigate to="/login" replace />;
  }

  // Already submitted enquiry, redirect to home
  if (enquirySubmitted) {
    return <Navigate to="/" replace />;
  }

  // Show initial enquiry form
  return <InitialEnquiry />;
};

export default InitialEnquiryGuard;
