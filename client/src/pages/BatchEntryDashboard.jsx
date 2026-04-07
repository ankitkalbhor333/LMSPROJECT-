import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import  batchentrythumbnail from "../assets/batchentrythumbnail.png";
import {
  Play,
  Radio,
  ClipboardList,
  Users,
  HelpCircle,
  ChevronRight,
  Flame,
} from "lucide-react";
import API from "../utils/api";
import { enrollmentAPI } from "../utils/enrollmentAPI";
import { resolveThumbnailUrl } from "../utils/mediaUrl";
import WhatsAppFloat from "../components/WhatsAppFloat";
import "./BatchEntryDashboard.css";

// Batch-specific WhatsApp group links configuration
const BATCH_WHATSAPP_LINKS = {
  // Map batch names/IDs to their WhatsApp group links
  "Navodaya class 5th": "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t",
  "sainik": "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t",
  "class 5": "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t",
  "class 6": "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t",
  // Add more batch-specific links as needed
};

const getWhatsAppLinkForBatch = (batchTitle = "") => {
  const lowerTitle = batchTitle.toLowerCase();
  
  // Check if any key in BATCH_WHATSAPP_LINKS matches the batch title
  for (const [key, link] of Object.entries(BATCH_WHATSAPP_LINKS)) {
    if (lowerTitle.includes(key)) {
      return link;
    }
  }
  
  // Return default link if no match found
  return BATCH_WHATSAPP_LINKS["navodaya"] || "https://chat.whatsapp.com/EnD4b5C2CDA3E1FiNF5wBq?mode=gi_t";
};

const normalizeCoursePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload.course && typeof payload.course === "object") {
    return payload.course;
  }

  return payload;
};

const countLecturesFromSubjects = (subjects = []) =>
  subjects.reduce(
    (subjectTotal, subject) =>
      subjectTotal +
      (Array.isArray(subject?.units)
        ? subject.units.reduce(
            (unitTotal, unit) => unitTotal + (Array.isArray(unit?.lectures) ? unit.lectures.length : 0),
            0
          )
        : 0),
    0
  );

// Reusable Feature Card Component with Framer Motion Animations
const FeatureCard = ({ title, description, icon: Icon, animationType, onClick, isLive }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const animationVariants = {
    lift: {
      whileHover: { y: -10 },
      whileTap: { scale: 0.95 },
    },
    bounce: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.9 },
      animate: { y: [0, -5, 0] },
      transition: { repeat: Infinity, duration: 2 },
    },
    pulse: {
      animate: { scale: [1, 1.02, 1] },
      transition: { repeat: Infinity, duration: 2 },
    },
    float: {
      whileHover: { y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
      animate: { y: [-5, 5, -5] },
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    },
    slide: {
      whileHover: { x: 5 },
      whileTap: { scale: 0.98 },
    },
  };

  const getAnimation = () => {
    switch (animationType) {
      case "lift":
        return animationVariants.lift;
      case "bounce":
        return animationVariants.bounce;
      case "pulse":
        return animationVariants.pulse;
      case "float":
        return animationVariants.float;
      case "slide":
        return animationVariants.slide;
      default:
        return animationVariants.lift;
    }
  };

  return (
    <motion.div
      className={`feature-card ${isLive ? "live-card" : ""}`}
      {...getAnimation()}
      onClick={onClick}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative" }}
    >
      {/* Hover Gradient Line - Moved from CSS */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "4px",
          background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
        }}
        animate={{
          scaleX: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        transformOrigin="left"
      />

      {/* Live Badge */}
      {isLive && (
        <motion.div
          className="live-badge"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Flame size={14} />
          LIVE NOW
        </motion.div>
      )}

      {/* Glow Effect for Live Classes */}
      {isLive && (
        <motion.div
          className="glow-effect"
          animate={{
            boxShadow: [
              "0 0 20px rgba(239, 68, 68, 0.4)",
              "0 0 40px rgba(239, 68, 68, 0.6)",
              "0 0 20px rgba(239, 68, 68, 0.4)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Icon */}
      <motion.div
        className={`card-icon-wrapper ${isLive ? "live-icon" : ""}`}
        whileHover={{ scale: 1.15, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon size={40} className="card-icon" />
      </motion.div>

      {/* Content */}
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>

      {/* Arrow */}
      <motion.div
        className="card-arrow"
        animate={{ x: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronRight size={20} />
      </motion.div>
    </motion.div>
  );
};

// Main Batch Entry Dashboard Component
function BatchEntryDashboard() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [selectedCard, setSelectedCard] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState({
    progressPercentage: 0,
    completedLectures: [],
    lastWatchedLecture: null,
    totalLectures: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch course data and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        console.log(`🔍 Fetching course with ID: ${batchId}`);

        // Fetch rich course player tree first (subjects -> units -> lectures)
        let normalizedCourse = null;
        try {
          const { data: playerResponse } = await API.get(`/courses/player/${batchId}`);
          normalizedCourse = normalizeCoursePayload(playerResponse);
          console.log("✅ Course player data fetched:", normalizedCourse);
        } catch (playerError) {
          console.warn("⚠️ Course player fetch failed, falling back to /courses/:id", playerError);
          const { data: fallbackResponse } = await API.get(`/courses/${batchId}`);
          normalizedCourse = normalizeCoursePayload(fallbackResponse);
          console.log("✅ Fallback course data fetched:", normalizedCourse);
        }

        if (!normalizedCourse) {
          throw new Error("Course data not available");
        }

        setCourseData(normalizedCourse);

        // Calculate total lectures in course
        const totalLectures = countLecturesFromSubjects(normalizedCourse.subjects || []);

        // Fetch progress data using the same API as CoursePlayer
        console.log(`📊 Fetching progress for course: ${batchId}`);
        const progressResponse = await enrollmentAPI.getCompletedLectures(batchId);
        console.log("✅ Progress data fetched:", progressResponse);

        setProgressData({
          progressPercentage: progressResponse.progressPercentage || 0,
          completedLectures: progressResponse.completedLectures || [],
          lastWatchedLecture: progressResponse.lastWatchedLecture || null,
          totalLectures: totalLectures || normalizedCourse.totalLectures || 0
        });

        setError("");
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        console.error("Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.response?.data?.message,
          courseId: batchId
        });
        
        // Set default progress on error
        setProgressData({
          progressPercentage: 0,
          completedLectures: [],
          lastWatchedLecture: null,
          totalLectures: 0
        });
        setError(err.response?.data?.message || err.message || "Failed to load batch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchData();
    }
  }, [batchId]);

  // Map courseData to batchData with all course details
  const batchData = courseData ? {
    title: courseData.title || "Course",
    description: courseData.description || "No description available",
    teacher: typeof courseData.teacher === 'object' && courseData.teacher?.name ? courseData.teacher.name : (typeof courseData.teacher === 'string' ? courseData.teacher : "Unknown Instructor"),
    instructor: {
      name: typeof courseData.teacher === 'object' && courseData.teacher?.name ? courseData.teacher.name : (typeof courseData.teacher === 'string' ? courseData.teacher : "Unknown Instructor")
    },
    duration: courseData.duration ? `${courseData.duration} weeks` : "Self-paced",
    category: courseData.category || "General",
    level: courseData.level || "Beginner",
    price: courseData.price || 0,
    discountPrice: courseData.discountPrice || null,
    currency: courseData.currency || "INR",
    language: courseData.language || "English",
    thumbnail: courseData.thumbnail ? resolveThumbnailUrl(courseData.thumbnail) : null,
    subjects: courseData.subjects || [],
    status: courseData.status || "draft",
    isPublished: courseData.isPublished || false,
    certificateAvailable: courseData.certificateAvailable || false,
    totalLectures: courseData.totalLectures || 0,
  } : {
    title: "Loading Course...",
    description: "Please wait while we load your course",
    teacher: "Instructor",
    instructor: {
      name: "Instructor"
    },
    duration: "Calculating...",
    category: "General",
    level: "Beginner",
    price: 0,
    discountPrice: null,
    currency: "INR",
    language: "English",
    thumbnail: null,
    subjects: [],
    status: "draft",
    isPublished: false,
    certificateAvailable: false,
    totalLectures: 0,
  };

  console.log("📊 BatchData:", batchData);
  console.log("📊 CourseData:", courseData);

  const features = [
    {
      id: "course-player",
      title: "Course Player",
      description: "Watch lectures and course materials at your own pace",
      icon: Play,
      animationType: "lift",
      route: `/course-player/${batchId}`,
      color: "from-blue-400 to-blue-600",
    },
    {
      id: "live-class",
      title: "Live Classes",
      description: "Join live interactive sessions with your instructor",
      icon: Radio,
      animationType: "pulse",
      route: `/live-class/${batchId}`,
      isLive: true,
      color: "from-red-400 to-red-600",
    },
    {
      id: "attempt-test",
      title: "Attempt Test",
      description: "Test your knowledge with interactive quizzes",
      icon: ClipboardList,
      animationType: "bounce",
      route: `/test/${batchId}`,
      color: "from-purple-400 to-purple-600",
    },
    {
      id: "community",
      title: "Community",
      description: "Connect with fellow learners and share experiences",
      icon: Users,
      animationType: "slide",
      route: `/community/${batchId}`,
      color: "from-green-400 to-green-600",
    },
    {
      id: "doubt-session",
      title: "Doubt Session",
      description: "Get your questions answered by instructors",
      icon: HelpCircle,
      animationType: "float",
      route: `/doubts/${batchId}`,
      color: "from-yellow-400 to-yellow-600",
    },
  ];

  const handleCardClick = (feature) => {
    setSelectedCard(feature.id);
    setTimeout(() => {
      navigate(feature.route);
    }, 300);
  };

  // Loading state
  if (loading) {
    return (
      <div className="batch-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading batch information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="batch-dashboard">
        <div className="error-container">
          <div className="error-content">
            <h2>⚠️ Unable to Load Batch</h2>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="retry-btn">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-dashboard">
      {/* Background Gradient */}
      <div className="dashboard-bg"></div>

      {/* Header Section */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button
          className="back-btn"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </motion.button>

        <div className="header-content">
          <h1 className="dashboard-title">{batchData.title}</h1>
          <p className="header-subtitle">by {batchData.instructor?.name || "Unknown Instructor"}</p>
        </div>

        <motion.div
          className="header-avatar"
          whileHover={{ scale: 1.05 }}
        >
          👨‍🎓
        </motion.div>
      </motion.div>

      {/* Course Details Section */}





      {/* Progress Section */}
      <motion.div
        className="progress-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="progress-info">
          <span className="progress-label">Your Progress</span>
          <span className="progress-text">
            {progressData.progressPercentage === 0
              ? "Start learning now"
              : `${progressData.completedLectures.length} of ${progressData.totalLectures} lectures completed`}
          </span>
        </div>
        <div className="progress-bar-wrapper">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progressData.progressPercentage}%` }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="progress-percentage">{progressData.progressPercentage}%</span>
      </motion.div>

      {/* Continue Learning Section */}
      {progressData.lastWatchedLecture && (
        <motion.div
          className="continue-learning"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="section-title">📚 Continue Learning</h3>
          <motion.div
            className="learning-card"
            whileHover={{ x: 5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
          >
            <div className="learning-card-content">
              <Play size={24} className="learning-icon" />
              <div>
                <h4>Resume Learning</h4>
                <p>Last watched: Lecture {progressData.lastWatchedLecture}</p>
              </div>
            </div>
            <ChevronRight size={24} className="learning-arrow" />
          </motion.div>
        </motion.div>
      )}

      {/* Features Grid */}
      <motion.div
        className="features-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h3 className="section-title">🚀 Learning Tools</h3>

        <div className="cards-container">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + index * 0.1,
                ease: "easeOut",
              }}
              className={`card-wrapper ${feature.isLive ? "live-highlight" : ""}`}
            >
              <style>
                {`
                  .${feature.id} {
                    background: linear-gradient(135deg, ${feature.color});
                  }
                `}
              </style>
              <FeatureCard
                {...feature}
                onClick={() => handleCardClick(feature)}
                isLive={feature.isLive}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="quick-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="stat-card">
          <span className="stat-number">{progressData.totalLectures}</span>
          <span className="stat-label">Total Lectures</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{progressData.completedLectures.length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">₹{batchData.price?.toLocaleString()}</span>
          <span className="stat-label">Price Paid</span>
        </div>
      </motion.div>



      <motion.div
        className="course-details"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {batchData.thumbnail && (
          <div className="course-thumbnail">
            <img src={batchentrythumbnail} alt={batchData.title} />
          </div>
        )}
        
        <div className="course-meta">
          <div className="meta-item">
            <span className="meta-label">📚 Category:</span>
            <span className="meta-value">{batchData.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">⭐ Level:</span>
            <span className="meta-value">{batchData.level}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">👨‍🏫 Instructor:</span>
            <span className="meta-value">{batchData.teacher}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">⏱️ Duration:</span>
            <span className="meta-value">{batchData.duration}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">🌍 Language:</span>
            <span className="meta-value">{batchData.language}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">💰 Price:</span>
            <span className="meta-value">₹{batchData.price?.toLocaleString()} {batchData.currency}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">📜 Certificate:</span>
            <span className="meta-value">{batchData.certificateAvailable ? "✓ Available" : "Not Available"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">📌 Status:</span>
            <span className="meta-value">{batchData.isPublished ? "Published" : "Draft"}</span>
          </div>
        </div>

        <div className="course-description">
          <h3>About This Course</h3>
          <p>{batchData.description}</p>
        </div>

        {/* Course Curriculum */}
        {batchData.subjects && batchData.subjects.length > 0 && (
          <div className="course-curriculum">
            <h3>📖 Course Curriculum</h3>
            <div className="curriculum-list">
              {batchData.subjects.map((subject, subjectIdx) => (
                <div key={subject._id} className="curriculum-subject">
                  <div className="subject-title">
                    <span className="subject-icon">📚</span>
                    <span className="subject-name">{subject.title || subject.name || `Subject ${subjectIdx + 1}`}</span>
                    <span className="unit-count">
                      {subject.units ? subject.units.length : 0} units
                    </span>
                  </div>
                  
                  {subject.units && subject.units.length > 0 && (
                    <div className="units-list">
                      {subject.units.map((unit, unitIdx) => (
                        <div key={unit._id || `${subject._id || subjectIdx}-unit-${unitIdx}`} className="curriculum-unit">
                          <div className="unit-title">
                            <span className="unit-icon">📝</span>
                            <span className="unit-name">{unit.title || unit.name || `Unit ${unitIdx + 1}`}</span>
                            <span className="lecture-count">
                              {unit.lectures ? unit.lectures.length : 0} lectures
                            </span>
                          </div>
                          
                          {/* {unit.lectures && unit.lectures.length > 0 && (
                            <div className="lectures-list">
                              {unit.lectures.map((lecture) => (
                                <div key={lecture._id} className="curriculum-lecture">
                                  <span className="lecture-icon">🎥</span>
                                  <span className="lecture-name">{lecture.title}</span>
                                </div>
                              ))}
                            </div>
                          )} */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        className="dashboard-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <p>💡 Tip: Join the live class for interactive learning!</p>
      </motion.div>

      {/* WhatsApp Float with Batch-Specific Link */}
      <WhatsAppFloat 
        batchLink={getWhatsAppLinkForBatch(batchData.title)} 
        batchName={batchData.title}
      />
    </div>
  );
}

export default BatchEntryDashboard;
