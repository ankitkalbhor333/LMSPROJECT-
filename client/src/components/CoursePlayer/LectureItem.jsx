import React, { useState } from "react";
import MaterialItem from "./MaterialItem";
import "./LectureItem.css";

const LectureItem = ({
  lecture,
  subjectId,
  unitId,
  isSelected,
  isCompleted,
  selectedMaterial,
  onLectureClick,
  onMaterialClick,
  onMarkComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLectureClick = () => {
    console.log("🖱️ LectureItem clicked, calling onLectureClick with:", lecture);
    onLectureClick(lecture, subjectId, unitId);
    setIsExpanded(true);
  };

  const hasMaterials = lecture.materials && lecture.materials.length > 0;

  const handleMarkComplete = (e) => {
    e.stopPropagation();
    onMarkComplete(lecture._id);
  };

  return (
    <div className={`lecture-item ${isSelected ? "selected" : ""} ${isCompleted ? "completed" : ""}`}>
      <div className="lecture-header" onClick={handleLectureClick}>
        <div className="lecture-left">
          {hasMaterials && (
            <span
              className={`expand-icon ${isExpanded ? "expanded" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title="Toggle materials"
            >
              ▶
            </span>
          )}
          {!hasMaterials && <span className="expand-icon placeholder" />}
          
          <span className="lecture-icon">
            {isCompleted ? "Done" : "Play"}
          </span>
        </div>

        <div className="lecture-middle">
          <span className="lecture-title">{lecture.title}</span>
          {lecture.duration && (
            <span className="lecture-duration">{lecture.duration} min</span>
          )}
        </div>

        <div className="lecture-right">
          {!isCompleted && (
            <button
              className="mark-complete-btn"
              onClick={handleMarkComplete}
              title="Mark as complete"
            >
              ✓
            </button>
          )}
          {isCompleted && (
            <span className="completion-badge">✓ Done</span>
          )}
        </div>
      </div>

      {hasMaterials && isExpanded && (
        <div className="lecture-content">
          {lecture.materials.map((material) => (
            <MaterialItem
              key={material._id}
              material={material}
              subjectId={subjectId}
              unitId={unitId}
              isSelected={selectedMaterial?._id === material._id}
              onMaterialClick={onMaterialClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LectureItem;
