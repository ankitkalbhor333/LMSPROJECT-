import { useState } from "react";
import API from "../../utils/api";
import StudyTabs from "../../components/freematerial/StudyTabs";
import VideoSection from "../../components/freematerial/VideoSection";
import NotesSection from "../../components/freematerial/NotesSection";
import TestSection from "../../components/freematerial/TestSection";
import "./FreeStudyMaterial.css";

const FreeStudyMaterial = () => {
  const [activeTab, setActiveTab] = useState("videos");
  const [videoPlayer, setVideoPlayer] = useState(null);
  const [testModal, setTestModal] = useState(null);

  // Handle video play
  const handlePlayVideo = (video) => {
    setVideoPlayer(video);
  };

  // Handle close video player
  const handleCloseVideo = () => {
    setVideoPlayer(null);
  };

  // Handle start test
  const handleStartTest = (test) => {
    setTestModal(test);
    setActiveTab("tests");
  };

  // Handle close test modal
  const handleCloseTest = () => {
    setTestModal(null);
  };

  return (
    <div className="free-study-page">
      <div className="study-header">
        <h1>Free Study Material</h1>
        <p>Access Free Videos, Notes & Mock Tests</p>
      </div>

      <StudyTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="study-content">
        {activeTab === "videos" && <VideoSection onPlayVideo={handlePlayVideo} />}
        {activeTab === "notes" && <NotesSection />}
        {activeTab === "tests" && <TestSection onStartTest={handleStartTest} />}
      </div>

      {/* Video Player Modal */}
      {videoPlayer && (
        <VideoPlayerModal video={videoPlayer} onClose={handleCloseVideo} />
      )}

      {/* Test Modal */}
      {testModal && (
        <TestModal test={testModal} onClose={handleCloseTest} />
      )}

      <div className="cta-banner">
        <h2>Want Full Access?</h2>
        <p>Unlock premium content and get expert guidance</p>
        <button className="cta-button">Join Full Course</button>
      </div>
    </div>
  );
};

// Video Player Modal Component
const VideoPlayerModal = ({ video, onClose }) => {
  // Ensure video URL is absolute. Use Vite env var `VITE_API_BASE` if provided.
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const getVideoUrl = (url) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    // Ensure leading slash
    return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Check if it's a YouTube video
  const isYoutubeVideo = !!(video.youtubeId || video.youtubeEmbedUrl);
  const youtubeEmbedUrl = isYoutubeVideo ? 
    (video.youtubeEmbedUrl || `https://www.youtube-nocookie.com/embed/${video.youtubeId}`) 
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="video-player">
          <h2>{video.title}</h2>
          <div className="video-placeholder">
            {isYoutubeVideo ? (
              <iframe
                width="100%"
                height="500"
                src={youtubeEmbedUrl}
                title="YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ backgroundColor: "#000" }}
              />
            ) : (
              <video
                controls
                width="100%"
                height="auto"
                style={{ backgroundColor: "#000" }}
              >
                <source src={getVideoUrl(video.videoUrl)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <div className="video-details">
            <p><strong>Teacher:</strong> {video.teacher}</p>
            <p><strong>Subject:</strong> {video.subject}</p>
            <p><strong>Class:</strong> {video.className}</p>
            <p><strong>Exam:</strong> {video.exam}</p>
            <p><strong>Duration:</strong> {video.duration}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Modal Component
const TestModal = ({ test, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!test || !test.questions) {
    return null;
  }

  const question = test.questions[currentQuestion];
  const totalQuestions = test.questions.length;

  const handleAnswerSelect = (optionIndex) => {
    if (!submitted) {
      setAnswers({
        ...answers,
        [currentQuestion]: optionIndex,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Submit answers to server for grading (server keeps correct answers private)
      const response = await API.post(`/freetests/${test._id}/submit`, { answers });
      if (response.data && response.data.success) {
        setScore(response.data.score);
        setSubmitted(true);
      } else {
        alert("Unable to grade test. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting free test:", err);
      alert("Error submitting test. Please try again.");
    }
  };

  if (submitted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content test-result" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>✕</button>
          <div className="result-content">
            <h2>Test Completed!</h2>
            <div className="score-display">
              <h3>Your Score</h3>
              <p className="score">{score}/{totalQuestions}</p>
              <p className="percentage">{percentage}%</p>
            </div>
            <div className="result-feedback">
              {percentage >= 80 && <p className="excellent">Excellent Performance! 🎉</p>}
              {percentage >= 60 && percentage < 80 && <p className="good">Good Job! Keep practicing.</p>}
              {percentage < 60 && <p className="improve">Review the topics and try again.</p>}
            </div>
            <button className="retry-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="test-container">
          <div className="test-header">
            <h2>{test.title}</h2>
            <p>Question {currentQuestion + 1} of {totalQuestions}</p>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>

          <div className="question-container">
            <h3>{question.question}</h3>

            <div className="options">
              {question.options.map((option, idx) => (
                <label key={idx} className="option-label">
                  <input
                    type="radio"
                    name="option"
                    checked={answers[currentQuestion] === idx}
                    onChange={() => handleAnswerSelect(idx)}
                    disabled={submitted}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="test-navigation">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="nav-btn"
            >
              ← Previous
            </button>

            <span className="question-counter">
              {currentQuestion + 1} / {totalQuestions}
            </span>

            {currentQuestion === totalQuestions - 1 ? (
              <button onClick={handleSubmit} className="submit-btn">
                Submit Test
              </button>
            ) : (
              <button onClick={handleNext} className="nav-btn">
                Next →
              </button>
            )}
          </div>

          <div className="question-overview">
            <p className="overview-label">Questions:</p>
            <div className="question-dots">
              {test.questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`dot ${
                    idx === currentQuestion
                      ? "active"
                      : answers[idx] !== undefined
                      ? "answered"
                      : "unanswered"
                  }`}
                  onClick={() => setCurrentQuestion(idx)}
                  title={`Question ${idx + 1}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeStudyMaterial;