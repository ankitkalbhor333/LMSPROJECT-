import React from "react";
import "./MaterialItem.css";

const MaterialItem = ({ 
  material, 
  subjectId, 
  unitId, 
  isSelected, 
  onMaterialClick 
}) => {
  const getFileIcon = () => {
    // Check for YouTube video first
    if (material.videoSource === 'youtube' || material.youtubeId || material.embedUrl) {
      return "🎬 YOUTUBE";
    }
    
    const type = material.type?.toLowerCase() || "";
    if (type.includes("pdf")) return "📄 PDF";
    if (type.includes("doc")) return "📝 DOC";
    if (type.includes("image")) return "🖼️ IMG";
    if (type.includes("video")) return "📹 VID";
    return "📎 FILE";
  };

  const handleClick = () => {
    console.log("📎 MaterialItem clicked:", material);
    onMaterialClick(material, subjectId, unitId);
  };

  return (
    <div
      className={`material-item ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
      <span className="material-icon">{getFileIcon()}</span>
      <div className="material-info">
        <div className="material-title">{material.title}</div>
        {material.fileSize && (
          <div className="material-size">{material.fileSize}</div>
        )}
      </div>
      <span className="material-arrow">→</span>
    </div>
  );
};

export default MaterialItem;
