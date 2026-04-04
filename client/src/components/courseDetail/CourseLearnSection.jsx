import { CheckCircle2, Sparkles } from "lucide-react";

function CourseLearnSection({ learningPoints, features }) {
  return (
    <section className="cd-surface cd-section">
      <div className="cd-section-head">
        <h2>What You Will Learn</h2>
        <p>Outcome-focused topics based on this course curriculum.</p>
      </div>

      {learningPoints.length > 0 ? (
        <ul className="cd-learn-list" aria-label="Learning points">
          {learningPoints.map((point, index) => (
            <li key={`${point}-${index}`}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cd-empty-text">Learning points will appear here once provided in course data.</p>
      )}

      {features.length > 0 ? (
        <div className="cd-feature-footer" aria-label="Course features">
          <span className="cd-feature-label">
            <Sparkles size={14} />
            Focus Areas
          </span>
          <div className="cd-feature-chips">
            {features.map((feature) => (
              <span key={feature} className="cd-feature-chip">
                {feature}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default CourseLearnSection;
