import { Quote, Star } from "lucide-react";

function CourseTestimonialsSection({ testimonials }) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="cd-surface cd-section">
      <div className="cd-section-head">
        <h2>Student Testimonials</h2>
        <p>Verified feedback from learners who completed this course.</p>
      </div>

      <div className="cd-testimonial-grid">
        {testimonials.slice(0, 4).map((testimonial) => {
          const rating = Number(testimonial.rating);
          const normalizedRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
          const showRating = normalizedRating > 0;

          return (
            <article className="cd-testimonial-card" key={testimonial.id}>
              <div className="cd-testimonial-head">
                <span className="cd-testimonial-quote" aria-hidden="true">
                  <Quote size={14} />
                </span>

                {showRating ? (
                  <span className="cd-testimonial-rating" aria-label={`Rated ${testimonial.ratingLabel}`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={`${testimonial.id}-star-${index + 1}`}
                        size={13}
                        fill={index < Math.round(normalizedRating) ? "currentColor" : "none"}
                      />
                    ))}
                    <strong>{testimonial.ratingLabel}</strong>
                  </span>
                ) : null}
              </div>

              <p className="cd-testimonial-comment">{testimonial.comment}</p>
              <p className="cd-testimonial-name">{testimonial.name}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CourseTestimonialsSection;
