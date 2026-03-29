import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock3, Rocket, ArrowLeft, PlayCircle } from "lucide-react";
import "./UpcomingFeaturePage.css";

const featureConfig = {
  "live-class": {
    title: "Live Classes",
    subtitle: "Real-time sessions with your instructor are coming soon.",
  },
  test: {
    title: "Tests",
    subtitle: "Interactive tests and score analytics are under development.",
  },
  community: {
    title: "Community",
    subtitle: "Learner discussions and group engagement features are coming soon.",
  },
  comunity: {
    title: "Community",
    subtitle: "Learner discussions and group engagement features are coming soon.",
  },
  doubts: {
    title: "Doubt Sessions",
    subtitle: "Ask questions and get guided help from mentors very soon.",
  },
};

function UpcomingFeaturePage({ featureKey }) {
  const navigate = useNavigate();
  const { batchId } = useParams();

  const selectedFeature = featureConfig[featureKey] || {
    title: "Upcoming Feature",
    subtitle: "This feature is in progress and will be available soon.",
  };

  return (
    <div className="upcoming-page">
      <div className="upcoming-card">
        <div className="upcoming-pill">
          <Clock3 size={16} />
          Upcoming Feature
        </div>

        <h1>{selectedFeature.title}</h1>
        <p>{selectedFeature.subtitle}</p>

        <div className="upcoming-note">
          <Rocket size={18} />
          We are actively building this module for your Batch Entry Dashboard.
        </div>

        <div className="upcoming-actions">
          <button
            type="button"
            className="upcoming-btn secondary"
            onClick={() => navigate(`/batch/${batchId}`)}
          >
            <ArrowLeft size={16} />
            Back to Batch Dashboard
          </button>

          <button
            type="button"
            className="upcoming-btn primary"
            onClick={() => navigate(`/course-player/${batchId}`)}
          >
            <PlayCircle size={16} />
            Go to Course Player
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpcomingFeaturePage;
