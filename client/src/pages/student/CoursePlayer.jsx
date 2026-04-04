import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEnrollment } from "../../hooks/useEnrollment";
import API from "../../utils/api";
import { enrollmentAPI } from "../../utils/enrollmentAPI";
import Sidebar from "../../components/CoursePlayer/Sidebar";
import PlayerContent from "../../components/CoursePlayer/PlayerContent";
import "./CoursePlayer.css";

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const getRoleFromToken = (token) => {
  if (!token) {
    return "";
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return "";
    }

    const decodedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(decodedPayload));
    return normalizeRole(parsed?.role);
  } catch {
    return "";
  }
};

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { hasAccessToCourse, isInitialized } = useEnrollment();
  const token = localStorage.getItem("token");
  const userRole = normalizeRole(localStorage.getItem("role")) || getRoleFromToken(token);
  const isAdmin = userRole === "admin";
  
  const [course, setCourse] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Track active subject and unit for highlighting
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeUnitId, setActiveUnitId] = useState(null);
  
  // Track completed lectures for progress (now loaded from backend)
  const [completedLectures, setCompletedLectures] = useState(new Set());
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Track last watched lecture for resume functionality
  const [lastWatchedLectureId, setLastWatchedLectureId] = useState(
    localStorage.getItem(`course_${courseId}_lastWatched`) || null
  );
  
  // Mobile sidebar toggle
  const [sidebarOpen] = useState(true);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
  
  // Track if progress is being saved
  const [savingProgress, setSavingProgress] = useState(false);

  const flattenedLectures = useMemo(() => {
    if (!course?.subjects) return [];

    const list = [];
    course.subjects.forEach((subject) => {
      subject.units?.forEach((unit) => {
        unit.lectures?.forEach((lecture) => {
          list.push({
            lecture,
            subjectId: subject._id,
            unitId: unit._id,
          });
        });
      });
    });

    return list;
  }, [course]);

  const currentLectureIndex = useMemo(() => {
    if (!selectedLecture?._id) return -1;
    return flattenedLectures.findIndex((item) => item.lecture._id === selectedLecture._id);
  }, [flattenedLectures, selectedLecture]);

  // Step 1: Check access first
  useEffect(() => {
    const checkAccess = async () => {
      if (!isInitialized) return;

      if (isAdmin) {
        fetchCourseData();
        return;
      }

      // Check if user has local access
      if (!hasAccessToCourse(courseId)) {
        // Verify with API
        try {
          const result = await enrollmentAPI.checkCourseAccess(courseId);
          if (!result.hasAccess) {
            setAccessDenied(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error checking access:", err);
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      // User has access, proceed to fetch course
      fetchCourseData();
    };

    if (courseId && isInitialized) {
      checkAccess();
    }
  }, [courseId, isInitialized, hasAccessToCourse]);

  // Step 2: Fetch course data AND load saved progress
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/courses/player/${courseId}`);
      const responseData = response?.data;
      const data =
        responseData?.data && typeof responseData.data === "object"
          ? responseData.data
          : responseData?.course && typeof responseData.course === "object"
            ? responseData.course
            : responseData;

      if (!data || typeof data !== "object") {
        throw new Error("Invalid course player payload");
      }

      console.log("✅ Course data fetched:", data);
      setCourse(data);
      setError(null);

      // Set initial lecture selection: last watched if present, otherwise first lecture.
      const lectureEntries = [];
      data?.subjects?.forEach((subject) => {
        subject.units?.forEach((unit) => {
          unit.lectures?.forEach((lecture) => {
            lectureEntries.push({ lecture, subjectId: subject._id, unitId: unit._id });
          });
        });
      });

      const resumedLecture = lectureEntries.find((entry) => entry.lecture._id === lastWatchedLectureId);
      const defaultLecture = resumedLecture || lectureEntries[0];

      if (defaultLecture) {
        setSelectedLecture(defaultLecture.lecture);
        setSelectedMaterial(null);
        setActiveSubjectId(defaultLecture.subjectId);
        setActiveUnitId(defaultLecture.unitId);
      }
      
      // Load saved progress from backend
      if (!isAdmin) {
        await loadSavedProgress();
      }
    } catch (err) {
      console.error("❌ Error fetching course:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load completed lectures from backend
  const loadSavedProgress = async () => {
    try {
      console.log("📚 Loading saved progress from backend...");
      const progressData = await enrollmentAPI.getCompletedLectures(courseId);
      
      if (progressData.completedLectures && Array.isArray(progressData.completedLectures)) {
        const completed = new Set(progressData.completedLectures);
        setCompletedLectures(completed);
        console.log(`✅ Loaded ${completed.size} completed lectures`);
      }
      
      if (progressData.progressPercentage) {
        setProgressPercentage(progressData.progressPercentage);
        console.log(`📊 Progress: ${progressData.progressPercentage}%`);
      }
      
      if (progressData.lastWatchedLecture) {
        setLastWatchedLectureId(progressData.lastWatchedLecture);
        localStorage.setItem(`course_${courseId}_lastWatched`, progressData.lastWatchedLecture);
      }
    } catch (err) {
      console.error("⚠️ Error loading saved progress:", err);
      // Continue without saved progress - it's not critical
    }
  };

  const handleLectureClick = (lecture, subjectId, unitId) => {
    console.log("📌 Lecture clicked:", lecture);
    setSelectedLecture(lecture);
    setSelectedMaterial(null);
    setMobileContentOpen(false);
    
    // Update active states for highlighting
    setActiveSubjectId(subjectId);
    setActiveUnitId(unitId);
    
    // Save last watched lecture
    setLastWatchedLectureId(lecture._id);
    localStorage.setItem(`course_${courseId}_lastWatched`, lecture._id);
  };

  const handleMaterialClick = (material, subjectId, unitId) => {
    console.log("📎 Material clicked:", material);
    setSelectedMaterial(material);
    
    // Update active states
    if (subjectId) setActiveSubjectId(subjectId);
    if (unitId) setActiveUnitId(unitId);
  };

  const navigateToLectureByIndex = (index) => {
    if (index < 0 || index >= flattenedLectures.length) {
      return;
    }

    const nextItem = flattenedLectures[index];
    handleLectureClick(nextItem.lecture, nextItem.subjectId, nextItem.unitId);
  };

  const handlePreviousLecture = () => {
    if (currentLectureIndex > 0) {
      navigateToLectureByIndex(currentLectureIndex - 1);
    }
  };

  const handleNextLecture = () => {
    if (currentLectureIndex >= 0 && currentLectureIndex < flattenedLectures.length - 1) {
      navigateToLectureByIndex(currentLectureIndex + 1);
    }
  };

  const handleOpenContent = () => {
    setMobileContentOpen(true);
  };

  // Mark lecture complete with backend persistence
  const markLectureComplete = async (lectureId) => {
    try {
      if (isAdmin) {
        setCompletedLectures((prev) => new Set([...prev, lectureId]));
        return;
      }

      setSavingProgress(true);
      console.log(`💾 Saving completion for lecture: ${lectureId}`);
      
      // Call API to save to backend
      const result = await enrollmentAPI.markLectureComplete(courseId, lectureId);
      
      // Update local state with API response
      setCompletedLectures(prev => new Set([...prev, lectureId]));
      setProgressPercentage(result.progressPercentage || 0);
      
      console.log(`✅ Lecture completed. Progress: ${result.progressPercentage}%`);
    } catch (err) {
      console.error("❌ Error marking lecture complete:", err);
      // Still update local state even if API fails
      setCompletedLectures(prev => new Set([...prev, lectureId]));
    } finally {
      setSavingProgress(false);
    }
  };

  // Access Denied
  if (accessDenied) {
    return (
      <div className="course-player-container">
        <div className="error-container" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>🔒</div>
            <h2 style={{
              color: '#333',
              marginBottom: '10px'
            }}>Access Denied</h2>
            <p style={{
              color: '#666',
              marginBottom: '20px'
            }}>You don't have access to this course. Please purchase it first.</p>
            <button
              onClick={() => navigate("/courses")}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="course-player-container">
        <div className="loading">Loading course...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="course-player-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="course-player-container">
        <div className="error">Course not found</div>
      </div>
    );
  }

  return (
    <div className="course-player-container">
      <div className="course-player-header">
        <div className="header-content">
          <h1>{course.title}</h1>
          <div className="header-progress">
            <span className="progress-text">{progressPercentage}% Complete</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="header-actions" role="navigation" aria-label="Course quick navigation">
            <button
              type="button"
              className="header-action-btn primary"
              onClick={handleOpenContent}
            >
              Course Content
            </button>
            <button
              type="button"
              className="header-action-btn"
              onClick={handlePreviousLecture}
              disabled={currentLectureIndex <= 0}
              aria-label="Go to previous lecture"
            >
              Previous
            </button>
            <button
              type="button"
              className="header-action-btn"
              onClick={handleNextLecture}
              disabled={currentLectureIndex < 0 || currentLectureIndex >= flattenedLectures.length - 1}
              aria-label="Go to next lecture"
            >
              Next
            </button>
            <span className="header-lecture-position" aria-live="polite">
              {flattenedLectures.length > 0 ? `${Math.max(currentLectureIndex + 1, 1)} / ${flattenedLectures.length}` : "0 / 0"}
            </span>
          </div>
        </div>
      </div>
      
      <div className="course-player-layout player-layout">
        {sidebarOpen && (
          <Sidebar
            className="desktop-sidebar"
            course={course}
            selectedLecture={selectedLecture}
            selectedMaterial={selectedMaterial}
            activeSubjectId={activeSubjectId}
            activeUnitId={activeUnitId}
            completedLectures={completedLectures}
            onLectureClick={handleLectureClick}
            onMaterialClick={handleMaterialClick}
            onMarkComplete={markLectureComplete}
          />
        )}
        
        <PlayerContent
          selectedLecture={selectedLecture}
          selectedMaterial={selectedMaterial}
          onOpenMobileContent={() => setMobileContentOpen(true)}
          onMarkComplete={markLectureComplete}
          onMaterialClick={handleMaterialClick}
          isLectureCompleted={selectedLecture && completedLectures.has(selectedLecture._id)}
          courseId={courseId}
          lectureId={selectedLecture?._id}
          courseProgress={progressPercentage}
          enableBackendProgress={!isAdmin}
          currentLectureIndex={currentLectureIndex}
          totalLectures={flattenedLectures.length}
          onPrevious={handlePreviousLecture}
          onNext={handleNextLecture}
          hasPrevious={currentLectureIndex > 0}
          hasNext={currentLectureIndex >= 0 && currentLectureIndex < flattenedLectures.length - 1}
          savingProgress={savingProgress}
        />
      </div>

      <div
        className={`content-sheet-backdrop ${mobileContentOpen ? "open" : ""}`}
        onClick={() => setMobileContentOpen(false)}
      />

      <div className={`content-sheet ${mobileContentOpen ? "open" : ""}`}>
        <div className="drag-handle" />
        <div className="content-sheet-header">
          <h3>Course Content</h3>
          <button
            type="button"
            className="content-sheet-close"
            onClick={() => setMobileContentOpen(false)}
          >
            Close
          </button>
        </div>
        <Sidebar
          className="mobile-sidebar-panel"
          showHeader={false}
          autoSelectOnExpand={false}
          course={course}
          selectedLecture={selectedLecture}
          selectedMaterial={selectedMaterial}
          activeSubjectId={activeSubjectId}
          activeUnitId={activeUnitId}
          completedLectures={completedLectures}
          onLectureClick={handleLectureClick}
          onMaterialClick={handleMaterialClick}
          onMarkComplete={markLectureComplete}
        />
      </div>
    </div>
  );
};

    
  
export default CoursePlayer;
