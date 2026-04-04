import { Award, GraduationCap } from "lucide-react";

const getInitials = (name = "") => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "IN";
};

function InstructorSection({ instructor }) {
  return (
    <section className="cd-surface cd-section">
      <div className="cd-section-head">
        <h2>Instructor</h2>
        <p>Learn from a mentor with domain-focused experience.</p>
      </div>

      <div className="cd-instructor-card">
        <div className="cd-instructor-avatar-wrap">
          {instructor.photo ? (
            <img src={instructor.photo} alt={instructor.name} className="cd-instructor-photo" />
          ) : (
            <span className="cd-instructor-avatar-fallback" aria-hidden="true">
              {getInitials(instructor.name)}
            </span>
          )}
        </div>

        <div className="cd-instructor-copy">
          <h3>{instructor.name}</h3>

          {instructor.experience ? (
            <p className="cd-instructor-meta">
              <Award size={14} />
              {instructor.experience}
            </p>
          ) : null}

          {instructor.bio ? (
            <p className="cd-instructor-bio">{instructor.bio}</p>
          ) : (
            <p className="cd-empty-text">Instructor bio will be available once shared in course data.</p>
          )}

          <span className="cd-instructor-chip">
            <GraduationCap size={14} />
            Mentor-led curriculum support
          </span>
        </div>
      </div>
    </section>
  );
}

export default InstructorSection;
