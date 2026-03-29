import React, { useState, useEffect } from "react";
import SubjectItem from "./SubjectItem";
import "./Sidebar.css";

const Sidebar = ({
  className = "",
  showHeader = true,
  autoSelectOnExpand = true,
  course,
  selectedLecture,
  selectedMaterial,
  activeSubjectId,
  activeUnitId,
  completedLectures,
  onLectureClick,
  onMaterialClick,
  onMarkComplete,
}) => {
  // Only allow one subject open at a time (accordion style)
  const [expandedSubjectId, setExpandedSubjectId] = useState(
    activeSubjectId || course?.subjects?.[0]?._id || null
  );
  
  // Auto-expand active subject if changed externally
  useEffect(() => {
    if (activeSubjectId && activeSubjectId !== expandedSubjectId) {
      setExpandedSubjectId(activeSubjectId);
    }
  }, [activeSubjectId]);

  const toggleSubject = (subjectId) => {
    // Close if clicking the same subject, otherwise open the new one
    setExpandedSubjectId((prev) =>
      prev === subjectId ? null : subjectId
    );
  };
  
  // Calculate progress
  const totalLectures = course?.subjects?.reduce((sum, subject) => {
    return sum + (subject.units?.reduce((unitSum, unit) => {
      return unitSum + (unit.lectures?.length || 0);
    }, 0) || 0);
  }, 0) || 0;
  
  const completionPercentage = totalLectures > 0 
    ? Math.round((completedLectures.size / totalLectures) * 100)
    : 0;

  return (
    <div className={`sidebar ${className}`.trim()}>
      {showHeader && (
        <div className="sidebar-header">
          <div className="header-top">
            <h2>Course Content</h2>
          </div>
          {totalLectures > 0 && (
            <div className="progress-section">
              <div className="progress-text">
                <span className="progress-label">Progress</span>
                <span className="progress-value">{completionPercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="progress-counter">
                {completedLectures.size} / {totalLectures} completed
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sidebar-content">
        {course?.subjects?.map((subject) => (
          <SubjectItem
            key={subject._id}
            subject={subject}
            isExpanded={expandedSubjectId === subject._id}
            isActive={activeSubjectId === subject._id}
            activeUnitId={activeUnitId}
            completedLectures={completedLectures}
            onToggle={() => toggleSubject(subject._id)}
            selectedLecture={selectedLecture}
            selectedMaterial={selectedMaterial}
            onLectureClick={onLectureClick}
            onMaterialClick={onMaterialClick}
            onMarkComplete={onMarkComplete}
            autoSelectOnExpand={autoSelectOnExpand}
          />
        ))}

        {!course?.subjects || course.subjects.length === 0 && (
          <div className="empty-state">
            <div className="empty-text">No content available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
