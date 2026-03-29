import React, { useState, useEffect } from "react";
import UnitItem from "./UnitItem";
import "./SubjectItem.css";

const SubjectItem = ({
  subject,
  isExpanded,
  isActive,
  activeUnitId,
  completedLectures,
  onToggle,
  selectedLecture,
  selectedMaterial,
  onLectureClick,
  onMaterialClick,
  onMarkComplete,
  autoSelectOnExpand = true,
}) => {
  // Only allow one unit open at a time within this subject
  const [expandedUnitId, setExpandedUnitId] = useState(
    activeUnitId && subject?.units?.some(u => u._id === activeUnitId) 
      ? activeUnitId
      : isExpanded ? subject?.units?.[0]?._id : null
  );

  const handleToggle = () => {
    console.log(`📁 Toggling subject: ${subject.title} (${subject._id})`);
    onToggle();
    
    // When expanding, auto-select first unit
    if (!isExpanded) {
      setExpandedUnitId(subject?.units?.[0]?._id || null);
      // Auto-click first lecture if it exists
      const firstUnit = subject?.units?.[0];
      const firstLecture = firstUnit?.lectures?.[0];
      if (autoSelectOnExpand && firstLecture) {
        onLectureClick(firstLecture, subject._id, firstUnit._id);
      }
    } else {
      // When collapsing, reset expanded unit
      setExpandedUnitId(null);
    }
  };

  const handleUnitToggle = (unitId) => {
    // Close if clicking the same unit, otherwise open the new one
    setExpandedUnitId((prev) => {
      if (prev === unitId) {
        return null;
      } else {
        // Auto-select first lecture in newly opened unit
        const newUnit = subject?.units?.find(u => u._id === unitId);
        const firstLecture = newUnit?.lectures?.[0];
        if (autoSelectOnExpand && firstLecture) {
          onLectureClick(firstLecture, subject._id, unitId);
        }
        return unitId;
      }
    });
  };

  // Calculate subject progress
  const totalLecturesInSubject = subject?.units?.reduce((sum, unit) => {
    return sum + (unit.lectures?.length || 0);
  }, 0) || 0;
  
  const completedLecturesInSubject = subject?.units?.reduce((sum, unit) => {
    return sum + (unit.lectures?.filter(l => completedLectures.has(l._id)).length || 0);
  }, 0) || 0;
  
  const subjectProgress = totalLecturesInSubject > 0 
    ? Math.round((completedLecturesInSubject / totalLecturesInSubject) * 100)
    : 0;

  return (
    <div className={`subject-item ${isActive ? "active" : ""}`}>
      <div 
        className={`subject-header ${isExpanded ? "expanded" : ""}`}
        onClick={handleToggle}
      >
        <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
          ▶
        </span>
        <div className="subject-info">
          <span className="subject-title">{subject.title}</span>
          {totalLecturesInSubject > 0 && (
            <span className="subject-stats">
              {completedLecturesInSubject}/{totalLecturesInSubject}
            </span>
          )}
        </div>
        {totalLecturesInSubject > 0 && subjectProgress > 0 && (
          <div className="subject-progress-mini">
            <div className="progress-fill-mini" style={{ width: `${subjectProgress}%` }}></div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="subject-content">
          {subject.units?.map((unit) => (
            <UnitItem
              key={unit._id}
              unit={unit}
              subjectId={subject._id}
              isExpanded={expandedUnitId === unit._id}
              isActive={activeUnitId === unit._id}
              completedLectures={completedLectures}
              onToggle={() => handleUnitToggle(unit._id)}
              selectedLecture={selectedLecture}
              selectedMaterial={selectedMaterial}
              onLectureClick={onLectureClick}
              onMaterialClick={onMaterialClick}
              onMarkComplete={onMarkComplete}
            />
          ))}

          {!subject.units || subject.units.length === 0 && (
            <div className="empty-unit">
              <span className="empty-text">No units available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectItem;
