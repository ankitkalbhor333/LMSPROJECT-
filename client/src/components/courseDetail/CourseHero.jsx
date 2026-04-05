import { motion } from "framer-motion";
import { PlayCircle, Star, Users } from "lucide-react";
import { resolveThumbnailUrl } from "../../utils/mediaUrl";

const getEmbeddedVideoUrl = (rawUrl) => {
  if (!rawUrl) {
    return "";
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }

    if (parsed.hostname.includes("youtu.be")) {
      const shortId = parsed.pathname.replace("/", "").trim();
      if (shortId) {
        return `https://www.youtube-nocookie.com/embed/${shortId}`;
      }
    }
  } catch {
    return "";
  }

  return "";
};

function CourseHero({ course, onEnroll }) {
  const embeddedVideoUrl = getEmbeddedVideoUrl(course.previewVideo);
  const showEmbeddedVideo = Boolean(embeddedVideoUrl);
  const showInlineVideo = Boolean(course.previewVideo) && !showEmbeddedVideo;

  const numericRating = Number(course.rating);
  const normalizedRating = Number.isFinite(numericRating)
    ? Math.max(0, Math.min(5, numericRating))
    : 0;

  const showRating = normalizedRating > 0;
  const showStudents = Number(course.enrollmentCount) > 0;

  return (
    <section className="cd-hero cd-surface">
      <motion.div
        className="cd-hero-content"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="cd-kicker">Course Detail</p>
        <h1>{course.title}</h1>

        {course.subtitle ? <p className="cd-subtitle">{course.subtitle}</p> : null}

        {showRating || showStudents ? (
          <div className="cd-trust-row" aria-label="Course trust metrics">
            {showRating ? (
              <span className="cd-rating-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`rating-star-${index + 1}`}
                    size={14}
                    fill={index < Math.round(normalizedRating) ? "currentColor" : "none"}
                  />
                ))}
              </span>
            ) : null}

            {showRating ? (
              <span className="cd-trust-pill">
                <Star size={14} />
                {course.ratingLabel}
              </span>
            ) : null}

            {showStudents ? (
              <span className="cd-trust-pill">
                <Users size={14} />
                {course.studentsLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {course.features.length > 0 ? (
          <div className="cd-feature-chips" aria-label="Course feature chips">
            {course.features.slice(0, 4).map((feature) => (
              <span key={feature} className="cd-feature-chip">
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        <div className="cd-price-row">
          <span className="cd-price-label">Price</span>
          <span className="cd-price-wrap">
            <span className="cd-price">{course.priceLabel}</span>
            {course.discountPrice ? (
              <span className="cd-price-original">₹{Number(course.price).toLocaleString("en-IN")}</span>
            ) : null}
          </span>
        </div>

        <button type="button" className="cd-btn cd-btn-primary" onClick={onEnroll}>
          Enroll Now
        </button>
      </motion.div>

      <motion.div
        className="cd-hero-media"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.04 }}
      >
        {showEmbeddedVideo ? (
          <iframe
            className="cd-media-frame"
            src={embeddedVideoUrl}
            title={`${course.title} preview`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}

        {showInlineVideo ? (
          <video className="cd-media-video" controls poster={course.thumbnail ? resolveThumbnailUrl(course.thumbnail) : ""} src={course.previewVideo} />
        ) : null}

        {!showEmbeddedVideo && !showInlineVideo ? (
          <div className="cd-media-image-wrap">
            {course.thumbnail ? (
              <img src={resolveThumbnailUrl(course.thumbnail)} alt={course.title} className="cd-media-image" />
            ) : (
              <div className="cd-media-placeholder">
                <PlayCircle size={20} />
                <span>Preview Coming Soon</span>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}

export default CourseHero;
