import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Star, Trophy, Users } from "lucide-react";
import VideoCard from "./VideoCard";
import "./VideoTestimonialPage.css";

const testimonials = [
  {
    videoId: "dQw4w9WgXcQ",
    title: "Focused Strategy for JNVST",
    badge: "JNVST 2020 Selected",
    description:
      "I followed the weekly test + revision pattern and could clearly track weak chapters before exam day.",
    studentName: "Raj Kumar",
    location: "Jaisalmer, Rajasthan",
  },
  {
    videoId: "9bZkp7q19f0",
    title: "Confidence with Consistency",
    badge: "JNVST 2021 Selected",
    description:
      "The mentor feedback after every mock helped me fix mistakes quickly and build confidence every week.",
    studentName: "Priya Singh",
    location: "Rajasthan",
  },
  {
    videoId: "kJQP7kiw9Fk",
    title: "Concept Clarity + Practice",
    badge: "JNV Selected",
    description:
      "Recorded lessons plus live doubt support made preparation clear, fast, and less stressful.",
    studentName: "Punit Thakur",
    location: "Betul, Madhya Pradesh",
  },
  {
    videoId: "L8FhBRE7jXw",
    title: "Mentor-Led Sainik Preparation",
    badge: "Sainik School Selected",
    description:
      "Personalized mentoring and regular doubt sessions made a huge difference in my final performance.",
    studentName: "Aisha Patel",
    location: "Gujarat",
  },
];

const proofStats = [
  {
    icon: Star,
    value: "4.8/5",
    label: "Video feedback rating",
    tone: "gold",
  },
  {
    icon: Users,
    value: "1000+",
    label: "Students shared outcomes",
    tone: "indigo",
  },
  {
    icon: Trophy,
    value: "500+",
    label: "Selections from coached batches",
    tone: "green",
  },
];

function VideoTestimonialPage() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const activeVideo = useMemo(
    () => testimonials[activeVideoIndex] || testimonials[0],
    [activeVideoIndex],
  );

  return (
    <section className="testimonial-page" id="video-testimonials">
      <div className="testimonial-container">
        <motion.div
          className="testimonial-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="video-label">
            <PlayCircle size={15} />
            Video Testimonials
          </span>
          <h2>
            Real Students, Real Results,
            <span> Real Confidence</span>
          </h2>
          <p>See how students prepared, improved, and achieved Navodaya and Sainik selections.</p>
        </motion.div>

        <motion.div
          className="video-proof-strip"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        >
          {proofStats.map((proof) => {
            const Icon = proof.icon;
            return (
              <article className={`video-proof-card video-proof-${proof.tone}`} key={proof.label}>
                <span className="video-proof-icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{proof.value}</strong>
                  <span>{proof.label}</span>
                </div>
              </article>
            );
          })}
        </motion.div>

        <div className="testimonial-showcase-grid">
          <motion.article
            className="featured-video-panel"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="featured-video-shell">
              <iframe
                className="featured-video-frame"
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="featured-video-copy">
              <span className="featured-video-badge">{activeVideo.badge}</span>
              <h3>{activeVideo.title}</h3>
              <p>{activeVideo.description}</p>

              <div className="featured-video-meta">
                <strong>{activeVideo.studentName}</strong>
                <span>{activeVideo.location}</span>
              </div>
            </div>
          </motion.article>

          <motion.div
            className="testimonial-list-panel"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
          >
            {testimonials.map((testimonial, index) => (
              <VideoCard
                key={`${testimonial.studentName}-${testimonial.videoId}`}
                videoId={testimonial.videoId}
                title={testimonial.title}
                badge={testimonial.badge}
                description={testimonial.description}
                studentName={testimonial.studentName}
                location={testimonial.location}
                isActive={index === activeVideoIndex}
                onSelect={() => setActiveVideoIndex(index)}
              />
            ))}

            <a href="/contact" className="testimonial-contact-cta">
              Need guidance? Talk to our mentor team
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default VideoTestimonialPage;