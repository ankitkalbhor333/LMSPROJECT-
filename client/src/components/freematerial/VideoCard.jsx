import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VideoCard.css";

const VideoCard = ({ video, onPlay }) => {
  if (!video) return null;

  const navigate = useNavigate();
  const isYoutubeVideo = !!(video.youtubeId || video.youtubeEmbedUrl);

  const handlePlay = () => {
    // Navigate to full-page video player
    navigate(`/free-video/${video._id}`);
  };

  return (
    <div className="video-card">
      <div className="video-thumbnail">
        <img src="https://th.bing.com/th?id=ORMS.6c7bbc68c900ace443b9a8b02cec6e25&pid=Wdp&w=612&h=304&qlt=90&c=1&rs=1&dpr=1&p=0" alt={video.title} />
        <div className="play-overlay" onClick={handlePlay}>
          <span className="play-icon">▶</span>
        </div>
        {isYoutubeVideo && (
          <div className="video-source-badge">🎬 YOUTUBE</div>
        )}
      </div>
      <div className="video-info">
        <h3>{video.title}</h3>
        <p className="subject"><strong>Subject:</strong> {video.subject}</p>
        <p className="class"><strong>Class:</strong> {video.className}</p>
        <p className="exam"><strong>Exam:</strong> {video.exam}</p>
        <p className="teacher"><strong>Teacher:</strong> {video.teacher}</p>
        <p className="duration"><strong>Duration:</strong> {video.duration}</p>
        <div className="card-buttons">
          <button className="watch-btn" onClick={handlePlay}>Watch Online</button>
          {/* <button className="download-btn">Download</button> */}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;