import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import "./FreeVideoPlayer.css";

const FreeVideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || "https://lmsproject1-cuzs.onrender.com";

  // Fetch the current video
  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  // Fetch related videos when main video loads
  useEffect(() => {
    if (video) {
      fetchRelatedVideos();
    }
  }, [video]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/videos/${videoId}`);
      setVideo(response.data.data);
    } catch (err) {
      console.error("Error fetching video:", err);
      setError("Failed to load video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedVideos = async () => {
    try {
      if (!video.subject) return;
      const response = await API.get(`/videos/subject/${video.subject}`);
      const videos = (response.data.data || []).filter(
        (v) => v._id !== videoId
      );
      setRelatedVideos(videos.slice(0, 5));
    } catch (err) {
      console.error("Error fetching related videos:", err);
    }
  };

  const getVideoUrl = (url) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const isYoutubeVideo = !!(video?.youtubeId || video?.youtubeEmbedUrl);
  const youtubeEmbedUrl = isYoutubeVideo
    ? video?.youtubeEmbedUrl || `https://www.youtube-nocookie.com/embed/${video?.youtubeId}`
    : null;

  if (loading) {
    return (
      <div className="video-player-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-player-page">
        <div className="error-container">
          <h2>❌ {error || "Video not found"}</h2>
          <button className="back-button" onClick={() => navigate("/freematerial")}>
            ← Back to Free Materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-page">
      {/* Video Player Container */}
      <div className="player-container">
        <button className="back-button" onClick={() => navigate("/freematerial")}>
          ← Back
        </button>

        <div className="main-player">
          {/* Video Player */}
          <div className="video-iframe-container">
            {isYoutubeVideo ? (
              <iframe
                className="video-iframe"
                src={youtubeEmbedUrl}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video
                className="video-player-native"
                controls
                style={{ backgroundColor: "#000", width: "100%", height: "100%" }}
              >
                <source src={getVideoUrl(video.videoUrl)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Video Title */}
          <div className="player-header">
            <div>
              <h1>{video.title}</h1>
              <p className="teacher-name">By {video.teacher}</p>
            </div>
            {isYoutubeVideo && (
              <div className="source-badge">🎬 YOUTUBE</div>
            )}
          </div>

          {/* Video Details */}
          <div className="video-details-section">
            <div className="details-grid">
              <div className="detail-item">
                <label>Subject</label>
                <p>{video.subject}</p>
              </div>
              <div className="detail-item">
                <label>Class</label>
                <p>{video.className}</p>
              </div>
              <div className="detail-item">
                <label>Exam</label>
                <p>{video.exam}</p>
              </div>
              <div className="detail-item">
                <label>Duration</label>
                <p>{video.duration}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="description-section">
            <h2>About This Video</h2>
            <p>
              This free study material video covers {video.subject} for {video.className} students preparing for {video.exam}.
              Learn from expert instructor {video.teacher} in this comprehensive lesson.
            </p>
          </div>

          {/* Share Section */}
          <div className="share-section">
            <h3>Share This Video</h3>
            <div className="share-buttons">
              <button 
                className="share-btn whatsapp"
                onClick={() => {
                  const text = `Check out this free video: ${video.title}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                }}
              >
                WhatsApp
              </button>
              <button 
                className="share-btn facebook"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`);
                }}
              >
                Facebook
              </button>
              <button 
                className="share-btn twitter"
                onClick={() => {
                  const text = `Watch this free {video.title} - ${video.subject} `;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${window.location.href}`);
                }}
              >
                Twitter
              </button>
            </div>
          </div>
        </div>

        {/* Related Videos Sidebar */}
        <aside className="related-videos-section">
          <h3>Related Videos</h3>
          <div className="related-videos-list">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((relatedVideo) => (
                <div
                  key={relatedVideo._id}
                  className="related-video-card"
                  onClick={() => navigate(`/free-video/${relatedVideo._id}`)}
                >
                  <div className="related-thumbnail">
                    <img
                      src="https://th.bing.com/th?id=ORMS.6c7bbc68c900ace443b9a8b02cec6e25&pid=Wdp&w=612&h=304&qlt=90&c=1&rs=1&dpr=1&p=0"
                      alt={relatedVideo.title}
                    />
                    <div className="play-icon-small">▶</div>
                  </div>
                  <div className="related-info">
                    <h4>{relatedVideo.title}</h4>
                    <p className="related-teacher">{relatedVideo.teacher}</p>
                    <p className="related-subject">{relatedVideo.subject}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-related">No related videos found</p>
            )}
          </div>
        </aside>
      </div>

      {/* CTA Banner */}
      <div className="cta-banner">
        <h2>Want More Content?</h2>
        <p>Unlock premium courses and get expert guidance from experienced teachers</p>
        <button className="cta-button" onClick={() => navigate("/courses")}>
          Explore Premium Courses
        </button>
      </div>
    </div>
  );
};

export default FreeVideoPlayer;
