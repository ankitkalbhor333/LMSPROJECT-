import "./heroFeatures.css";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🎥",
    title: "Live Classes",
    desc: "Interactive mentor-led sessions with real-time doubt support and exam strategy.",
  },
  {
    icon: "📚",
    title: "Recorded Lectures",
    desc: "Structured recorded modules with replay access so students can revise anytime.",
  },
  {
    icon: "📝",
    title: "Test Series",
    desc: "Weekly mock tests and smart analysis to improve speed, accuracy, and confidence.",
  },
];

const HeroFeatures = () => {
  return (
    <section className="hero-features-section">
      <div className="hero-features-container">
        <motion.div
          className="hero-features-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="hero-features-kicker">Built For Serious Aspirants</p>
          <h2>Everything Students Need To Perform Better</h2>
        </motion.div>

        <div className="hero-features-grid">
          {features.map((item, index) => (
            <motion.article
              key={item.title}
              className="hero-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <span className="hero-feature-icon" aria-hidden>
                {item.icon}
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroFeatures;
