import { GraduationCap, MapPin, Quote, TrendingUp, Trophy } from "lucide-react";
import "./StoryCard.css";

function StoryCard({
  name,
  batch,
  location,
  badge,
  description,
  scoreLift,
  scoreBefore,
  scoreAfter,
  tone = "indigo",
  badgeTone,
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className={`story-card story-card-${tone}`}>
      <div className="story-card-head">
        <span className="story-quote" aria-hidden="true">
          <Quote size={15} />
        </span>
        <span className={`story-badge story-badge-${badgeTone || tone}`}>{badge}</span>
      </div>

      <p className="story-text">{description}</p>

      <div className="story-card-highlights">
        <span className="story-highlight-pill story-highlight-pill-green">
          <TrendingUp size={13} />
          {scoreLift} score boost
        </span>
      </div>

      <div className="story-score-compare" aria-label={`${name} score improvement`}>
        <div className="story-score-line">
          <span>Before</span>
          <strong>{scoreBefore}</strong>
        </div>
        <div className="story-score-track">
          <span style={{ width: scoreBefore }} />
        </div>

        <div className="story-score-line story-score-line-after">
          <span>After</span>
          <strong>{scoreAfter}</strong>
        </div>
        <div className="story-score-track story-score-track-after">
          <span style={{ width: scoreAfter }} />
        </div>
      </div>

      <div className="story-card-meta">
        <span>
          <GraduationCap size={13} />
          {batch}
        </span>
        <span>
          <MapPin size={13} />
          {location}
        </span>
        <span className="story-meta-result">
          <Trophy size={13} />
          {badge}
        </span>
      </div>

      <div className="story-footer">
        <div className="story-user">
          <div className={`avatar avatar-${tone}`}>{initials}</div>
          <div>
            <h4>{name}</h4>
            <p>Student Success Story</p>
          </div>
        </div>

        <span className="story-score-pill">
          <TrendingUp size={13} />
          Score {scoreLift}
        </span>
      </div>
    </article>
  );
}

export default StoryCard;