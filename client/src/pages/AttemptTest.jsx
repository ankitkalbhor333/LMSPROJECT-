import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
} from "lucide-react";
import API from "../utils/api";
import "./AttemptTest.css";

const AttemptTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (!test || submitted) return;

    if (timeLeft === null) {
      setTimeLeft(test.duration * 60); // Convert minutes to seconds
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, test, submitted]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/tests/${id}`);
      setTest(res.data);
    } catch (err) {
      console.error("Error loading test:", err);
      setError(
        err.response?.data?.message || "Failed to load test. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const answerArray = test.questions.map((q) =>
        answers[q._id] !== undefined ? answers[q._id] : null
      );

      const res = await API.post(`/tests/submit/${id}`, {
        answers: answerArray,
      });

      setResult(res.data);
      setSubmitted(true);
      setShowConfirm(false);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err.response?.data?.message ||
          "Error submitting test. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? "0" : ""}${mins}:${
        secs < 10 ? "0" : ""
      }${secs}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getTimeStatus = () => {
    if (!timeLeft) return "neutral";
    if (timeLeft <= 60) return "critical";
    if (timeLeft <= 300) return "warning";
    return "safe";
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getTotalQuestions = () => {
    return test?.questions?.length || 0;
  };

  // Loading state
  if (loading) {
    return (
      <div className="attempt-test-container loading-state">
        <div className="spinner"></div>
        <p>Loading test...</p>
      </div>
    );
  }

  // Error state
  if (error && !submitted) {
    return (
      <div className="attempt-test-container">
        <motion.div className="error-banner" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle size={24} />
          <div>
            <h3>Unable to Load Test</h3>
            <p>{error}</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} /> Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // Test not found
  if (!test) {
    return (
      <div className="attempt-test-container">
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle size={64} />
          <h2>Test Not Found</h2>
          <p>The test you're looking for doesn't exist or has been deleted.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // Results page
  if (submitted && result) {
    // Parse percentage properly (handle string format like "60.00%" or "60.00")
    const percentageStr = String(result.percentage).replace("%", "");
    const percentageNum = parseFloat(percentageStr) || 0;
    const passPercentage = 60;
    const passed = percentageNum >= passPercentage;

    return (
      <div className="attempt-test-container results-page">
        <motion.div
          className="results-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`results-badge ${passed ? "passed" : "failed"}`}>
            {passed ? (
              <CheckCircle2 size={64} />
            ) : (
              <AlertCircle size={64} />
            )}
          </div>

          <h1 className="results-title">
            {passed ? "Congratulations! 🎉" : "Good Try! 📚"}
          </h1>

          <p className="results-subtitle">
            {passed
              ? "You passed the test successfully!"
              : "Don't give up. Keep learning and try again!"}
          </p>

          <div className="results-score">
            <div className="score-circle">
              <svg viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={passed ? "#10b981" : "#ef4444"}
                  strokeWidth="8"
                  strokeDasharray={`${(percentageNum / 100) * 565} 565`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
              </svg>
              <div className="score-text">
                <span className="percentage">{Math.round(percentageNum)}%</span>
                <span className="label">Score</span>
              </div>
            </div>
          </div>

          <div className="results-details">
            <div className="detail-item">
              <span className="detail-label">Correct Answers</span>
              <span className="detail-value">{result.score}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Questions</span>
              <span className="detail-value">{result.total}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Percentage</span>
              <span className="detail-value">{percentageNum.toFixed(2)}%</span>
            </div>
          </div>

          <div className="results-actions">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-primary"
            >
              <ArrowLeft size={16} /> Back to Tests
            </button>
            <button
              onClick={() => navigate(-2)}
              className="btn btn-secondary"
            >
              <ExternalLink size={16} /> Go to Batch
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const isAnswered = answers[question._id] !== undefined;
  const answeredCount = getAnsweredCount();
  const totalQuestions = getTotalQuestions();

  return (
    <div className="attempt-test-container">
      {/* Header */}
      <motion.header
        className="test-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <button
            onClick={() => navigate(-1)}
            className="header-back-btn"
            title="Go back to tests"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="test-title">{test.title}</h1>
            <p className="progress-text">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className={`timer-box ${getTimeStatus()}`}>
          <Clock size={20} />
          <span className="timer-text">{formatTime(timeLeft || 0)}</span>
          {getTimeStatus() === "critical" && (
            <span className="timer-warning">Time running out!</span>
          )}
        </div>
      </motion.header>

      <div className="test-content">
        {/* Question Card */}
        <motion.div
          className="question-card"
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="question-header">
            <div className="question-number">Q{currentQuestion + 1}</div>
            <div className="question-status">
              {isAnswered ? (
                <div className="answered-indicator">
                  <CheckCircle2 size={18} />
                  <span>Answered</span>
                </div>
              ) : (
                <div className="unanswered-indicator">
                  <AlertCircle size={18} />
                  <span>Unanswered</span>
                </div>
              )}
            </div>
          </div>

          <div className="question-text">
            <h2>{question.question}</h2>
          </div>

          <div className="options-container">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                className={`option-button ${
                  answers[question._id] === index ? "selected" : ""
                }`}
                onClick={() => handleOptionSelect(question._id, index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="option-radio">
                  <div className="radio-circle">
                    {answers[question._id] === index && (
                      <motion.div
                        className="radio-fill"
                        layoutId="selected-option"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </div>
                </div>
                <span className="option-text">{option}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Sidebar */}
        <aside className="test-sidebar">
          {/* Progress */}
          <div className="progress-box">
            <h3>Progress</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(answeredCount / totalQuestions) * 100}%`,
                }}
              />
            </div>
            <p className="progress-text">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>

          {/* Question Navigator */}
          <div className="navigator-box">
            <h3>Questions</h3>
            <div className="questions-grid">
              {test.questions.map((q, idx) => (
                <motion.button
                  key={idx}
                  className={`question-btn ${
                    idx === currentQuestion ? "active" : ""
                  } ${answers[q._id] !== undefined ? "answered" : ""}`}
                  onClick={() => setCurrentQuestion(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions-box">
            <h3>Instructions</h3>
            <ul>
              <li>Each question has only one correct answer</li>
              <li>You can navigate between questions freely</li>
              <li>Review your answers before submitting</li>
              <li>The test will auto-submit when time expires</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Footer with Navigation */}
      <motion.footer
        className="test-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="footer-left">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setCurrentQuestion((prev) =>
                Math.min(totalQuestions - 1, prev + 1)
              )
            }
            disabled={currentQuestion === totalQuestions - 1}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="btn btn-submit"
          disabled={submitting}
        >
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      </motion.footer>

      {/* Confirmation Modal */}
      {showConfirm && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowConfirm(false)}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Submit Test?</h2>
            <p>
              You have answered <strong>{answeredCount}</strong> out of{" "}
              <strong>{totalQuestions}</strong> questions.
            </p>
            <p className="modal-warning">Once submitted, you cannot change your answers.</p>

            <div className="modal-actions">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary"
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-submit"
              >
                {submitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AttemptTest;