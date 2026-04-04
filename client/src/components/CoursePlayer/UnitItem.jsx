import React from "react";
import LectureItem from "./LectureItem";
import "./UnitItem.css";

const UnitItem = ({
  unit,
  subjectId,
  isExpanded,
  isActive,
  completedLectures,
  onToggle,
  selectedLecture,
  selectedMaterial,
  onLectureClick,
  onMaterialClick,
  onMarkComplete,
}) => {
  const handleToggle = () => {
    console.log(`📚 Toggling unit: ${unit.title} (${unit._id})`);
    onToggle();
  };

  // Calculate unit progress
  const totalLecturesInUnit = unit.lectures?.length || 0;
  const completedLecturesInUnit = unit.lectures?.filter(l => completedLectures.has(l._id)).length || 0;
  const unitProgress = totalLecturesInUnit > 0 
    ? Math.round((completedLecturesInUnit / totalLecturesInUnit) * 100)
    : 0;

  return (
    <div className={`unit-item ${isExpanded ? "expanded" : ""} ${isActive ? "active" : ""}`}>
      <div className="unit-header" onClick={handleToggle}>
        <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
          ▶
        </span>
        <div className="unit-info">
          <span className="unit-title">{unit.title}</span>
          {totalLecturesInUnit > 0 && (
            <span className="unit-stats">
              {completedLecturesInUnit}/{totalLecturesInUnit}
            </span>
          )}
        </div>
        {totalLecturesInUnit > 0 && unitProgress > 0 && (
          <div className="unit-progress-mini">
            <div className="progress-fill-mini" style={{ width: `${unitProgress}%` }}></div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="unit-content">
          {unit.lectures?.map((lecture) => (
            <LectureItem
              key={lecture._id}
              lecture={lecture}
              subjectId={subjectId}
              unitId={unit._id}
              isSelected={selectedLecture?._id === lecture._id}
              isCompleted={completedLectures.has(lecture._id)}
              selectedMaterial={selectedMaterial}
              onLectureClick={onLectureClick}
              onMaterialClick={onMaterialClick}
              onMarkComplete={onMarkComplete}
            />
          ))}

          {!unit.lectures || unit.lectures.length === 0 && (
            <div className="empty-lecture">
              <span className="empty-text">No lectures available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitItem;
