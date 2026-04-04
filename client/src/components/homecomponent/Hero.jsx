import "./hero.css"
import teacherImage from "../../assets/teacherImage.png";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -35 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="hero">
      <div className="hero-container">
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span 
            className="badge"
            variants={badgeVariants}
          >
            ⭐ India's Most Trusted Platform
          </motion.span>

          <motion.h1 
            className="hero-title"
            variants={itemVariants}
          >
            <span className="title-line title-line-small">Master your</span>
            <span className="title-line title-line-main gradient-text">Navodaya & Sainik</span>
            <span className="title-line title-line-medium">School Entrance Exams</span>
          </motion.h1>

          <motion.p 
            className="hero-subtitle"
            variants={itemVariants}
          >
            Join thousands of successful students. Expert-led online and offline coaching 
            for JNVST and Sainik School entrance exams with proven track record.
          </motion.p>

          <motion.div className="hero-trust-row" variants={itemVariants}>
            <span className="trust-item trust-item-rating">
              <Star size={16} fill="currentColor" />
              <span>4.8/5 rating</span>
            </span>
            <span className="trust-separator" aria-hidden="true">•</span>
            <span className="trust-item">1000+ students</span>
            <span className="trust-separator" aria-hidden="true">•</span>
            <span className="trust-item">500+ selections</span>
          </motion.div>

          <motion.div 
            className="hero-buttons"
            variants={itemVariants}
          >
            <Link to="/courses" className="btn btn-primary btn-lg">
              Explore Courses
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-lg">
              Book Free Demo
            </Link>
          </motion.div>

        </motion.div>

        <motion.div 
          className="hero-image-wrapper"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="image-container">
            <div className="image-blur-shape" aria-hidden="true"/>
            <div className="image-panel">
              <img
                src={teacherImage}
                alt="Expert Coaching"
                className="hero-image"
              />
            </div>
            <div className="image-glow"/>
          </div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="hero-decoration hero-decoration-1"/>
      <div className="hero-decoration hero-decoration-2"/>

      <div className="hero-floating-elements" aria-hidden="true">
        <span className="floating-orb floating-orb-1"/>
        <span className="floating-orb floating-orb-2"/>
        <span className="floating-orb floating-orb-3"/>
      </div>
    </section>
  );
};

export default Hero;