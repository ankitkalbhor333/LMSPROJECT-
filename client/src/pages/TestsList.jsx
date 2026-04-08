import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, ArrowLeft, Clock, BarChart3, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import API from "../utils/api";
import "./TestsList.css";

const TestsList = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState({});

  useEffect(() => {
    fetchTestsAndResults();
  }, [batchId]);

  const fetchTestsAndResults = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch tests for this course
      const testsResponse = await API.get(`/tests/course/${batchId}`);
      setTests(testsResponse.data || []);

      // Fetch user's results
      const resultsResponse = await API.get("/tests/my-results");
      const resultsMap = {};
      resultsResponse.data?.forEach((result) => {
        resultsMap[result.test._id] = result;
      });
      setResults(resultsMap);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(err.response?.data?.message || "Failed to load tests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttemptTest = (testId) => {
    navigate(`/attempt-test/${testId}`);
  };

  const getTestStatus = (testId) => {
    if (results[testId]) {
      return {
        attempted: true,
        score: results[testId].score,
        total: results[testId].totalQuestions,
        percentage: results[testId].percentage,
      };
    }
    return { attempted: false };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  // Loading state
  if (loading) {
    return (
      <div className="tests-list-container loading-state">
        <div className="spinner"></div>
        <p>Loading available tests...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tests-list-container error-state">
        <div className="error-card">
          <AlertCircle size={48} />
          <h2>Unable to Load Tests</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              <ArrowLeft size={18} /> Go Back
            </button>
            <button onClick={fetchTestsAndResults} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tests-list-container">
      {/* Header */}
      <motion.div
        className="tests-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Batch</span>
        </button>
        <div className="header-content">
          <ClipboardList size={32} className="header-icon" />
          <div>
            <h1>Available Tests</h1>
            <p>{tests.length} test{tests.length !== 1 ? "s" : ""} available for your batch</p>
          </div>
        </div>
      </motion.div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ClipboardList size={64} />
          <h2>No Tests Available</h2>
          <p>Your instructor hasn't created any tests for this batch yet.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Return to Batch
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="tests-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tests.map((test) => {
            const status = getTestStatus(test._id);
            const passPercentage = 60; // Passing score percentage

            return (
              <motion.div
                key={test._id}
                className="test-card"
                variants={itemVariants}
                whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0, 0, 0, 0.12)" }}
              >
                {/* Status Badge */}
                {status.attempted && (
                  <div
                    className={`status-badge ${
                      status.percentage >= passPercentage ? "passed" : "failed"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Attempted</span>
                  </div>
                )}

                {status.attempted && (
                  <div className="lock-overlay">
                    <Lock size={24} />
                    <p>Already Attempted</p>
                  </div>
                )}

                {/* Card Content */}
                <div className="card-header">
                  <h3 className="test-title">{test.title}</h3>
                </div>

                <div className="card-info">
                  <div className="info-item">
                    <Clock size={18} className="icon" />
                    <div>
                      <span className="label">Duration</span>
                      <span className="value">{test.duration || 30} mins</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <BarChart3 size={18} className="icon" />
                    <div>
                      <span className="label">Questions</span>
                      <span className="value">{test.questions?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Score Display if Attempted */}
                {status.attempted && (
                  <div className="score-section">
                    <div className="score-display">
                      <div
                        className="score-circle"
                        style={{
                          background: `conic-gradient(
                            ${status.percentage >= passPercentage ? "#10b981" : "#ef4444"} 0deg ${
                            (status.percentage / 100) * 360
                          }deg,
                            #e5e7eb ${(status.percentage / 100) * 360}deg
                          )`,
                        }}
                      >
                        <div className="score-inner">
                          <span className="score-text">{Math.round(status.percentage)}%</span>
                        </div>
                      </div>
                      <div className="score-info">
                        <p className="score-result">
                          {status.percentage >= passPercentage ? "Passed ✓" : "Failed"}
                        </p>
                        <p className="score-details">
                          {status.score} of {status.total} correct
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <motion.button
                  className={`attempt-button ${status.attempted ? "disabled" : ""}`}
                  onClick={() => !status.attempted && handleAttemptTest(test._id)}
                  whileHover={!status.attempted ? { scale: 1.02 } : {}}
                  whileTap={!status.attempted ? { scale: 0.98 } : {}}
                  disabled={status.attempted}
                >
                  {status.attempted ? (
                    <>
                      <Lock size={16} />
                      <span>Already Taken</span>
                    </>
                  ) : (
                    <>
                      <ClipboardList size={16} />
                      <span>Attempt Test</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default TestsList;
