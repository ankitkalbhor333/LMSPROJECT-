import "./whychoose.css";
import { motion } from "framer-motion";
import {
  Target,
  BarChart3,
  Smartphone,
  GraduationCap,
  Star,
  Trophy,
  Users,
} from "lucide-react";

const whyChooseItems = [
  {
    icon: Target,
    title: "Structured Courses",
    description:
      "Roadmap-based learning with concept clarity, revision cycles, and exam-time strategy for each phase.",
  },
  {
    icon: BarChart3,
    title: "Weekly Tests",
    description:
      "Detailed mock analytics, weak-area reports, and mentor-led action plans to improve every week.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Responsive classes, revision modules, and quick doubt support so students stay consistent anywhere.",
  },
  {
    icon: GraduationCap,
    title: "Expert Mentors",
    description:
      "Experienced faculty with exam-specific mentoring for Navodaya and Sainik aspirants.",
  },
];

const trustHighlights = [
  {
    icon: Star,
    value: "4.8/5",
    label: "Rated by students & parents",
    tone: "gold",
  },
  {
    icon: Users,
    value: "10,000+",
    label: "Learners trained so far",
    tone: "indigo",
  },
  {
    icon: Trophy,
    value: "500+",
    label: "Final selections achieved",
    tone: "green",
  },
];

const WhyChoose = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  };

  return (
    <section className="why-choose-section" id="why-choose">
      <div className="why-choose-container">
        <motion.div
          className="why-choose-head"
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="why-kicker">Why Choose Us</p>
          <h2>Why Students and Parents Trust  Brain Roots Academy</h2>
          <p className="why-subtitle">
            Purpose-built learning stack for Navodaya and Sainik exams with measurable progress,
            mentor support, and real exam confidence.
          </p>
        </motion.div>

        <motion.div
          className="why-trust-strip"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
        >
          {trustHighlights.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <article
                className={`why-trust-pill why-trust-pill-${highlight.tone}`}
                key={highlight.label}
              >
                <span className="why-trust-icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div className="why-trust-copy">
                  <strong>{highlight.value}</strong>
                  <span>{highlight.label}</span>
                </div>
              </article>
            );
          })}
        </motion.div>

        <motion.div
          className="why-card-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {whyChooseItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article className="why-card" key={item.title} variants={itemVariants}>
                <div className="why-icon-wrap" aria-hidden="true">
                  <Icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChoose;