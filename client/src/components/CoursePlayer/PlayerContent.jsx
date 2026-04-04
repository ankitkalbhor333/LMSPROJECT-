import React, { useEffect, useState, useRef } from "react";
import { enrollmentAPI } from "../../utils/enrollmentAPI";
import "./PlayerContent.css";

const PlayerContent = ({ 
  selectedLecture, 
  selectedMaterial,
  onOpenMobileContent,
  onMarkComplete,
  onMaterialClick,
  isLectureCompleted,
  courseId,
  lectureId,
  enableBackendProgress = true,
  courseProgress = 0,
  currentLectureIndex = -1,
  totalLectures = 0,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  savingProgress = false,
}) => {
  const [autoCompletedAt90Percent, setAutoCompletedAt90Percent] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log("📺 PlayerContent updated:");
    console.log("  - selectedLecture:", selectedLecture);
    console.log("  - selectedMaterial:", selectedMaterial);
  }, [selectedLecture, selectedMaterial]);

  // Reset auto-complete flag when lecture changes
  useEffect(() => {
    setAutoCompletedAt90Percent(false);
  }, [lectureId]);

  // Handle video progress tracking
  const handleVideoTimeUpdate = async (e) => {
    if (!selectedLecture || !courseId || autoCompletedAt90Percent) return;

    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    if (duration && duration > 0) {
      const watchedPercentage = (currentTime / duration) * 100;

      // Auto-complete at 90%
      if (watchedPercentage >= 90 && !autoCompletedAt90Percent) {
        console.log("🎉 Auto-completing lecture at 90% watch threshold!");
        setAutoCompletedAt90Percent(true);

        // Call API to mark complete
        if (onMarkComplete) {
          try {
            await onMarkComplete(selectedLecture._id);
            console.log("✅ Lecture auto-completed via API");
          } catch (err) {
            console.error("Error auto-completing lecture:", err);
          }
        }
      }

      if (!enableBackendProgress) {
        return;
      }

      // Update progress (without auto-completing yet)
      try {
        await enrollmentAPI.updateLectureProgress(courseId, selectedLecture._id, Math.round(watchedPercentage));
      } catch (err) {
        // Silently fail - don't spam logs with progress updates
        // console.error("Error updating progress:", err);
      }
    }
  };

  if (!selectedLecture && !selectedMaterial) {
    return (
      <div className="player-content">
        <div className="empty-player">
          <div className="empty-icon">🎬</div>
          <div className="empty-title">Welcome to the Course</div>
          <div className="empty-text">Select a lecture or material from the sidebar to begin learning</div>
          <div className="empty-tips">
            <div className="tip">▶ Click on any lecture to play the video</div>
            <div className="tip">📄 Expand lectures to see additional materials</div>
            <div className="tip">✓ Mark lectures as complete when done</div>
            <div className="tip">✨ Lectures auto-complete after watching 90%</div>
          </div>
        </div>
      </div>
    );
  }

  // Show material (PDF or file)
  if (selectedMaterial) {
    const fileUrl = selectedMaterial.fileUrl;
    const fullFileUrl = fileUrl?.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL}${fileUrl}`;
    const materialType = selectedMaterial.type?.toLowerCase() || "";
    const isVideo = materialType.includes('video') || fileUrl?.includes('.mp4') || fileUrl?.includes('.webm') || fileUrl?.includes('.avi');
    const isPdf = materialType.includes('pdf') || fileUrl?.includes('.pdf');
    
    console.log("📄 Rendering material - File URL:", fullFileUrl);
    console.log("📄 Material type:", materialType);
    console.log("📄 Is video:", isVideo);
    
    return (
      <div className="player-content">
        <div className="player-header">
          <div className="header-left">
            <div className="player-type-badge">📎 Material</div>
            <div className="player-title">{selectedMaterial.title}</div>
          </div>
          {fileUrl && (
            <a
              href={fullFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="download-btn"
            >
              ⬇️ Download
            </a>
          )}
        </div>

        <div className="player-body">
          {fileUrl ? (
            isVideo ? (
              <video
                src={fullFileUrl}
                controls
                className="video-player"
                controlsList="nodownload"
                onLoadStart={() => console.log("📥 Video material loading started")}
                onCanPlay={() => console.log("✅ Video material can play")}
                onError={(e) => {
                  console.error("❌ Video material error:", e);
                  console.log("Problem loading video from:", fullFileUrl);
                }}
              />
            ) : isPdf ? (
              <iframe
                src={fullFileUrl}
                title={selectedMaterial.title}
                className="material-viewer"
                allowFullScreen
                onLoad={() => console.log("✅ PDF iframe loaded")}
                onError={(e) => console.error("❌ PDF iframe error:", e)}
              />
            ) : (
              <iframe
                src={fullFileUrl}
                title={selectedMaterial.title}
                className="material-viewer"
                allowFullScreen
                onLoad={() => console.log("✅ Material iframe loaded")}
                onError={(e) => console.error("❌ Material iframe error:", e)}
              />
            )
            
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-icon">📄</div>
              <div className="placeholder-text">Material file not available</div>
              <div className="placeholder-subtext">
                Admin needs to upload and assign a file to this material
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show lecture video
  if (selectedLecture) {
    const videoUrl = selectedLecture.videoUrl;
    const fullVideoUrl = videoUrl?.startsWith('http') ? videoUrl : `${import.meta.env.VITE_API_URL}${videoUrl}`;
    
    // Check for YouTube video in lecture materials
    const isYoutubeVideo = !!(selectedLecture.youtubeId || selectedLecture.youtubeEmbedUrl);
    const youtubeEmbedUrl = isYoutubeVideo ? 
      (selectedLecture.youtubeEmbedUrl || `https://www.youtube-nocookie.com/embed/${selectedLecture.youtubeId}`) 
      : null;
    
    console.log("🎬 Rendering video - URL:", fullVideoUrl);
    console.log("🎬 YouTube Video found:", isYoutubeVideo, "ID:", selectedLecture.youtubeId);
    console.log("🎬 Materials available:", selectedLecture.materials?.length || 0);
    
    return (
      <div className="player-content">
        <div className="player-header">
          <div className="header-left">
            <div className="player-type-badge">Lecture</div>
            <div>
              <div className="player-title">
                Lecture {currentLectureIndex >= 0 ? currentLectureIndex + 1 : "-"}: {selectedLecture.title}
              </div>
              <div className="player-meta">
                {selectedLecture.duration ? `${selectedLecture.duration} min` : "Duration not available"}
                {isLectureCompleted && <span className="completed-tag">Completed</span>}
              </div>
            </div>
          </div>
          <div className="header-right">{totalLectures > 0 ? `${currentLectureIndex + 1} / ${totalLectures}` : ""}</div>
        </div>

        <div className="player-body">
          <div className="video-header mobile-content-trigger">
            <button
              type="button"
              className="floating-content-btn"
              onClick={onOpenMobileContent}
            >
              Content
            </button>
          </div>
          {isYoutubeVideo && youtubeEmbedUrl ? (
            // YouTube Video Display
            <div className="youtube-player-wrapper">
              <iframe
                src={youtubeEmbedUrl}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={selectedLecture.title}
                className="youtube-player"
                onLoad={() => console.log("✅ YouTube video loaded")}
                onError={(e) => {
                  console.error("❌ YouTube video error:", e);
                  console.log("Problem loading YouTube video:", youtubeEmbedUrl);
                }}
              />
            </div>
          ) : videoUrl ? (
            // Local Video File Display
            <video
              ref={videoRef}
              key={fullVideoUrl}
              src={fullVideoUrl}
              controls
              className="video-player"
              controlsList="nodownload"
              onLoadStart={() => console.log("📥 Video loading started")}
              onCanPlay={() => console.log("✅ Video can play")}
              onTimeUpdate={handleVideoTimeUpdate}
              onError={(e) => {
                console.error("❌ Video error:", e);
                console.log("Problem loading video from:", fullVideoUrl);
              }}
            />
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-icon">🎥</div>
              <div className="placeholder-text">Video not available for this lecture</div>
              <div className="placeholder-subtext">
                Admin needs to upload and assign a video to this lecture
              </div>
            </div>
          )}
        </div>

        <div className="mobile-lecture-summary" aria-live="polite">
          <div className="mobile-lecture-title">
            Lecture {currentLectureIndex >= 0 ? currentLectureIndex + 1 : "-"}: {selectedLecture.title}
          </div>
          <div className="mobile-lecture-meta">
            {selectedLecture.duration ? `${selectedLecture.duration} min` : "Duration not available"}
            <span className="mobile-dot">•</span>
            <span>{Math.max(0, Math.min(100, courseProgress || 0))}% complete</span>
          </div>
        </div>

        <div className="player-footer-controls">
          <div className="content-progress-bar">
            <div className="content-progress-fill" style={{ width: `${Math.max(0, Math.min(100, courseProgress || 0))}%` }}></div>
          </div>

          <div className="content-action-row">
            <button
              type="button"
              className="content-btn secondary"
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              Previous
            </button>

            <button
              type="button"
              className="content-btn secondary"
              onClick={onNext}
              disabled={!hasNext}
            >
              Next
            </button>

            {!isLectureCompleted && onMarkComplete && (
              <button
                type="button"
                className="content-btn primary"
                onClick={() => onMarkComplete(selectedLecture._id)}
                disabled={savingProgress}
              >
                {savingProgress ? "Saving..." : "Mark as Complete"}
              </button>
            )}

            {isLectureCompleted && (
              <div className="completed-indicator">Completed</div>
            )}
          </div>
        </div>

        {selectedLecture.materials && selectedLecture.materials.length > 0 && (
          <div className="player-materials">
            <div className="materials-title">📎 Lecture Materials ({selectedLecture.materials.length})</div>
            <div className="materials-list">
              {selectedLecture.materials.map((material) => {
                const materialFileUrl = material.fileUrl;
                const fullMaterialUrl = materialFileUrl?.startsWith('http') 
                  ? materialFileUrl 
                  : `${import.meta.env.VITE_API_URL}${materialFileUrl}`;
                
                const isYoutubeMaterial = material.videoSource === 'youtube' || material.youtubeId || material.embedUrl;
                
                return (
                  <div key={material._id} className={`material-badge ${isYoutubeMaterial ? 'youtube-badge' : ''} ${selectedMaterial?._id === material._id ? 'active' : ''}`}>
                    <span className="badge-icon">{isYoutubeMaterial ? '🎬' : '📎'}</span>
                    <span 
                      className="badge-title"
                      onClick={() => {
                        console.log("📎 Material badge clicked:", material);
                        onMaterialClick && onMaterialClick(material);
                      }}
                      style={{ cursor: onMaterialClick ? 'pointer' : 'default' }}
                    >
                      {material.title}
                    </span>
                    {materialFileUrl && !isYoutubeMaterial && (
                      <a
                        href={fullMaterialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge-download"
                        title="Download material"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⬇️
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default PlayerContent;
