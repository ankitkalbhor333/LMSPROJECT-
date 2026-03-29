import { MapPin, Play } from "lucide-react";
import "./VideoCard.css";

function VideoCard({
  videoId,
  title,
  description,
  badge,
  studentName,
  location,
  isActive,
  onSelect,
}) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <button
      type="button"
      className={`vt-card ${isActive ? "is-active" : ""}`}
      onClick={onSelect}
      aria-label={`Play testimonial by ${studentName}`}
    >
      <div className="vt-thumb-wrap">
        <img src={thumbnailUrl} alt={`${studentName} testimonial`} className="vt-thumb-image" loading="lazy" />
        <span className="vt-play-badge" aria-hidden="true">
          <Play size={14} fill="currentColor" />
        </span>
      </div>

      <div className="vt-copy">
        <span className="vt-badge">{badge}</span>
        <h4>{studentName}</h4>
        <p className="vt-title">{title}</p>
        <p className="vt-description">{description}</p>

        <div className="vt-meta">
          <MapPin size={13} />
          <span>{location}</span>
        </div>
      </div>
    </button>
  );
}

export default VideoCard;