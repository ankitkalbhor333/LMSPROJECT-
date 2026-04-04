import { useState, useRef, useEffect } from "react";
import API from "../../utils/api";
import { useToast } from "../../contexts/ToastContext";
import "./Lecture.css";

function LectureItem({ lecture, unitId, onRefresh, onDelete }) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [showUploadVideo, setShowUploadVideo] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadVideoFile, setUploadVideoFile] = useState(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(lecture);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  // YouTube link input states
  const [videoUploadMode, setVideoUploadMode] = useState("file"); // "file" or "youtube"
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [addingYoutube, setAddingYoutube] = useState(false);

  // Update currentLecture when lecture prop changes
  useEffect(() => {
    setCurrentLecture(lecture);
  }, [lecture]);

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const res = await API.get(`/materials/lecture/${lecture._id}`);
      // Handle wrapped response format from backend
      const materialsData = res.data.data || res.data || [];
      setMaterials(materialsData);
    } catch (err) {
      console.error("Error loading materials:", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadVideos = async (lectureData = null) => {
    try {
      setLoadingVideos(true);
      const videosList = [];

      // Use provided lecture data or fall back to current state
      const lecture = lectureData || currentLecture;

      // 1. Add lecture's local video (videoUrl) if exists
      if (lecture.videoUrl) {
        videosList.push({
          _id: `local-${lecture._id}`,
          title: `${lecture.title} - Main Video`,
          fileUrl: lecture.videoUrl,
          type: "video/local",
          videoSource: "local",
          isLectureVideo: true,
          lectureId: lecture._id,
        });
      }

      // 2. Add lecture's YouTube video if exists
      if (lecture.youtubeId || lecture.youtubeLink) {
        videosList.push({
          _id: `youtube-${lecture._id}`,
          title: `${lecture.title} - YouTube`,
          youtubeId: lecture.youtubeId,
          youtubeLink: lecture.youtubeLink,
          youtubeEmbedUrl: lecture.youtubeEmbedUrl,
          type: "video/youtube",
          videoSource: "youtube",
          isYoutubeVideo: true,
          isLectureVideo: true,
          lectureId: lecture._id,
        });
      }

      // 3. Add material videos from materials collection
      const res = await API.get(`/materials/lecture/${lecture._id}`);
      const materialsData = res.data.data || res.data || [];
      const videoMaterials = materialsData.filter(m => 
        m.type && m.type.startsWith('video/')
      );
      
      videosList.push(...videoMaterials);

      setVideos(videosList);
    } catch (err) {
      console.error("Error loading videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleExpand = async () => {
    if (!isExpanded && (materials.length === 0 || videos.length === 0)) {
      await loadMaterials();
      await loadVideos();
    }
    setIsExpanded(!isExpanded);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert("Please select a valid video file");
        return;
      }
      // Validate file size (500MB max for videos)
      if (file.size > 500 * 1024 * 1024) {
        alert("Video size must be less than 500MB");
        return;
      }
      setUploadVideoFile(file);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();

    if (!materialTitle.trim()) {
      toast.warning("Please enter material title");
      return;
    }

    if (!uploadFile) {
      toast.warning("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("lectureId", lecture._id);
      formData.append("title", materialTitle);
      formData.append("type", uploadFile.type);
      formData.append("file", uploadFile);

      const res = await API.post("/materials/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMaterials([...materials, res.data.data]);
      setMaterialTitle("");
      setUploadFile(null);
      setShowUploadMaterial(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error("Failed to upload material: " + (err.response?.data?.message || err.message));
      console.error("Error uploading material:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();

    if (!videoTitle.trim()) {
      toast.warning("Please enter video title");
      return;
    }

    if (!uploadVideoFile) {
      toast.warning("Please select a video file");
      return;
    }

    try {
      setUploadingVideo(true);
      const formData = new FormData();
      formData.append("file", uploadVideoFile);

      // Upload to lecture's direct video endpoint
      const res = await API.post(`/lectures/${currentLecture._id}/video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Get the updated lecture from response
      const updatedLecture = res.data.data || res.data;

      // Update currentLecture with new video data
      setCurrentLecture(updatedLecture);

      // Reload videos with the freshly updated lecture data (no race condition)
      await loadVideos(updatedLecture);

      setVideoTitle("");
      setUploadVideoFile(null);
      setShowUploadVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      toast.success("Video uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload video: " + (err.response?.data?.message || err.message));
      console.error("Error uploading video:", err);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Extract video ID from YouTube URL
  // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  // Also handles query parameters like ?si=...
  const extractYouTubeId = (url) => {
    try {
      if (!url) return null;
      
      // Multiple regex patterns to handle different YouTube URL formats
      const patterns = [
        // youtu.be/ID or youtu.be/ID?...
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        // youtube.com/watch?v=ID or youtube.com/watch?v=ID&...
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        // youtube.com/embed/ID
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        // www.youtube.com variations
        /www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        // Direct 11-character video ID
        /^([a-zA-Z0-9_-]{11})$/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // If no pattern matched, try to extract 11 consecutive valid chars
      const directMatch = url.match(/([a-zA-Z0-9_-]{11})/);
      if (directMatch && directMatch[1]) {
        return directMatch[1];
      }
    } catch (e) {
      console.error("Error extracting YouTube ID:", e);
    }
    return null;
  };

  const handleAddYoutubeVideo = async (e) => {
    e.preventDefault();

    if (!youtubeTitle.trim()) {
      toast.warning("Please enter video title");
      return;
    }

    if (!youtubeLink.trim()) {
      toast.warning("Please enter YouTube link");
      return;
    }

    // Validate YouTube URL
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      toast.error("Please enter a valid YouTube URL (youtube.com or youtu.be)");
      return;
    }

    const videoId = extractYouTubeId(youtubeLink);
    console.log("Extracted YouTube ID:", videoId, "from URL:", youtubeLink);
    
    if (!videoId) {
      toast.error("Could not extract video ID from YouTube link. Please ensure the URL is valid (youtu.be/ID or youtube.com/watch?v=ID)");
      return;
    }

    try {
      setAddingYoutube(true);

      // Create video object with YouTube data
      // Using nocookie domain for privacy (for unlisted videos)
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

      console.log("Adding YouTube video:", { videoId, youtubeLink, embedUrl });

      // Save to lecture via new endpoint
      const res = await API.post(`/lectures/${lecture._id}/youtube`, {
        youtubeId: videoId,
        youtubeLink: youtubeLink,
        youtubeEmbedUrl: embedUrl
      });

      console.log("YouTube video added successfully:", res.data);

      // Get the updated lecture from response
      const updatedLecture = res.data.data || res.data;

      // Update local lecture state with the response data that includes YouTube fields
      setCurrentLecture(updatedLecture);

      // Reload materials and videos using the fresh lecture data (no race condition)
      await loadMaterials();
      await loadVideos(updatedLecture);
      setYoutubeTitle("");
      setYoutubeLink("");
      setVideoUploadMode("file");
      toast.success("YouTube video added to lecture successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      console.error("Error adding YouTube video:", {
        status: err.response?.status,
        message: errorMsg,
        fullError: err
      });
      toast.error("Failed to add YouTube video: " + errorMsg);
    } finally {
      setAddingYoutube(false);
    }
  };

  const handleDeleteLecture = async () => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) {
      return;
    }

    try {
      setDeleting(true);
      await API.delete(`/lectures/${lecture._id}`);
      
      // Notify parent to remove from local state
      if (onDelete) {
        onDelete(lecture._id);
      } else {
        // Fallback to refresh if onDelete not provided
        onRefresh();
      }
    } catch (err) {
      toast.error("Failed to delete lecture: " + (err.response?.data?.error || err.message));
      console.error("Error deleting lecture:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      await API.delete(`/materials/${materialId}`);
      setMaterials(materials.filter((m) => m._id !== materialId));
    } catch (err) {
      toast.error("Failed to delete material");
      console.error("Error deleting material:", err);
    }
  };

  const handleDeleteYoutubeVideo = async () => {
    if (!window.confirm("Are you sure you want to remove the YouTube video from this lecture?")) {
      return;
    }

    try {
      // Call backend to remove YouTube fields from lecture
      const res = await API.put(`/lectures/${currentLecture._id}`, {
        youtubeId: null,
        youtubeLink: null,
        youtubeEmbedUrl: null,
      });

      // Update local lecture state
      setCurrentLecture(res.data);

      // Remove from videos list
      setVideos(videos.filter((v) => v._id !== `youtube-${currentLecture._id}`));
      
      toast.success("YouTube video removed successfully!");
    } catch (err) {
      toast.error("Failed to remove YouTube video: " + (err.response?.data?.message || err.message));
      console.error("Error removing YouTube video:", err);
    }
  };

  const handleDeleteLectureVideo = async () => {
    if (!window.confirm("Are you sure you want to remove the video file from this lecture?")) {
      return;
    }

    try {
      // Call backend to clear videoUrl from lecture
      const res = await API.put(`/lectures/${currentLecture._id}`, {
        videoUrl: null,
      });

      // Update local lecture state
      setCurrentLecture(res.data);

      // Remove from videos list
      setVideos(videos.filter((v) => v._id !== `local-${currentLecture._id}`));
      
      toast.success("Video removed successfully!");
    } catch (err) {
      toast.error("Failed to remove video: " + (err.response?.data?.message || err.message));
      console.error("Error removing video:", err);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    // Check if it's a lecture YouTube video
    if (videoId === `youtube-${currentLecture._id}`) {
      return handleDeleteYoutubeVideo();
    }

    // Check if it's a lecture local video
    if (videoId === `local-${currentLecture._id}`) {
      return handleDeleteLectureVideo();
    }

    // Otherwise delete from materials
    try {
      await API.delete(`/materials/${videoId}`);
      setVideos(videos.filter((v) => v._id !== videoId));
    } catch (err) {
      alert("Failed to delete video");
      console.error("Error deleting video:", err);
    }
  };

  return (
    <div className="lecture-card">
      <div className="lecture-header">
        <button
          className="expansion-toggle"
          onClick={handleExpand}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <div className="lecture-info">
          <span className="lecture-icon">🎬</span>
          <h6 className="lecture-title">{lecture.title}</h6>
        </div>
        <div className="lecture-actions">
          <button
            className="btn-icon btn-delete-sm"
            onClick={handleDeleteLecture}
            disabled={deleting}
            title="Delete lecture"
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="lecture-content">
          {/* Videos Section */}
          <div className="videos-section">
            <div className="videos-header">
              <h6>Videos ({videos.length})</h6>
              <button
                className="btn btn-xs btn-warning"
                onClick={() => setShowUploadVideo(!showUploadVideo)}
              >
                {showUploadVideo ? "Cancel" : "📹 Upload"}
              </button>
            </div>

            {showUploadVideo && (
              <>
                {/* Upload Mode Selector */}
                <div className="upload-mode-selector" style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${videoUploadMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVideoUploadMode("file")}
                    style={{ flex: 1 }}
                  >
                    📁 Upload File
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${videoUploadMode === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVideoUploadMode("youtube")}
                    style={{ flex: 1 }}
                  >
                    🔗 YouTube Link
                  </button>
                </div>

                {/* File Upload Form */}
                {videoUploadMode === "file" && (
                  <form className="upload-form" onSubmit={handleUploadVideo}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Video title (e.g., Lecture Recording, Demo)"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      disabled={uploadingVideo}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      className="form-control form-control-sm"
                      onChange={handleVideoSelect}
                      disabled={uploadingVideo}
                      accept="video/*"
                    />
                    {uploadVideoFile && (
                      <small className="file-info">
                        Selected: {uploadVideoFile.name} ({(uploadVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                      </small>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary btn-xs"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? "Uploading..." : "Upload"}
                    </button>
                  </form>
                )}

                {/* YouTube Link Form */}
                {videoUploadMode === "youtube" && (
                  <form className="upload-form" onSubmit={handleAddYoutubeVideo}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Video title (e.g., Lecture Recording, Demo)"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      disabled={addingYoutube}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      disabled={addingYoutube}
                    />
                    <small className="form-help-text" style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                      💡 Works with standard YouTube links, short links (youtu.be), and unlisted videos. Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                    </small>
                    <button
                      type="submit"
                      className="btn btn-primary btn-xs"
                      disabled={addingYoutube}
                      style={{ marginTop: '8px' }}
                    >
                      {addingYoutube ? "Adding..." : "Add from YouTube"}
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="videos-list">
              {loadingVideos ? (
                <p className="loading-text">Loading videos...</p>
              ) : videos && videos.length > 0 ? (
                videos.map((video) => (
                  <div key={video._id} className="video-item">
                    <span className="video-icon">
                      {video.youtubeId ? "📹 (YouTube)" : "🎥"}
                    </span>
                    <div className="video-info">
                      <p className="video-title">{video.title}</p>
                      <small className="video-meta">
                        {video.youtubeId ? `YouTube • ${video.youtubeId}` : `${video.fileSize || ''} • ${video.type || "Video"}`}
                      </small>
                    </div>
                    <div className="video-actions">
                      <button
                        className="btn-icon-small btn-play-sm"
                        onClick={() => setPlayingVideo(video)}
                        title="Play video"
                      >
                        ▶
                      </button>
                      <button
                        className="btn-icon-small btn-delete-sm"
                        onClick={() => handleDeleteVideo(video._id)}
                        title="Delete video"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-videos">No videos uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Materials Section */}
          <div className="materials-section">
            <div className="materials-header">
              <h6>Materials ({materials.length})</h6>
              <button
                className="btn btn-xs btn-warning"
                onClick={() => setShowUploadMaterial(!showUploadMaterial)}
              >
                {showUploadMaterial ? "Cancel" : "📎 Upload"}
              </button>
            </div>

            {showUploadMaterial && (
              <form className="upload-form" onSubmit={handleUploadMaterial}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Material title (e.g., Lecture Notes, Practice PDF)"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  disabled={uploading}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control form-control-sm"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                />
                {uploadFile && (
                  <small className="file-info">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </small>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-xs"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </form>
            )}

            <div className="materials-list">
              {loadingMaterials ? (
                <p className="loading-text">Loading materials...</p>
              ) : materials && materials.length > 0 ? (
                materials.map((material) => (
                  <div key={material._id} className="material-item">
                    <span className="material-icon">📄</span>
                    <div className="material-info">
                      <p className="material-title">{material.title}</p>
                      <small className="material-meta">
                        {material.fileSize} • {material.type || "File"}
                      </small>
                    </div>
                    <div className="material-actions">
                      {material.fileUrl && (
                        <a
                          href={material.fileUrl}
                          className="btn-link"
                          download
                          title="Download"
                        >
                          ⬇
                        </a>
                      )}
                      <button
                        className="btn-icon-small btn-delete-sm"
                        onClick={() => handleDeleteMaterial(material._id)}
                        title="Delete material"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-materials">No materials uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Video Player Modal */}
          {playingVideo && (
            <div className="video-modal-overlay" onClick={() => setPlayingVideo(null)}>
              <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                <button
                  className="video-modal-close"
                  onClick={() => setPlayingVideo(null)}
                  title="Close"
                >
                  ✕
                </button>
                <h5>{playingVideo.title}</h5>
                {playingVideo.youtubeId ? (
                  // YouTube Embed
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                    <iframe
                      src={playingVideo.embedUrl || `https://www.youtube-nocookie.com/embed/${playingVideo.youtubeId}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px'
                      }}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={playingVideo.title}
                    />
                  </div>
                ) : (
                  // Local Video File
                  <video
                    className="video-player"
                    controls
                    autoPlay
                    style={{ width: "100%", maxHeight: "600px", borderRadius: "8px" }}
                  >
                    <source src={playingVideo.fileUrl} type={playingVideo.type} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LectureItem;
