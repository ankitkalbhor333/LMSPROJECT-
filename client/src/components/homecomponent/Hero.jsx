import "./hero.css"
import teacherImage from "../../assets/teacherImage.png";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Banner Slider Component
const BannerSlider = ({ banners: customBanners } = {}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Default banners - can be overridden with props
  const defaultBanners = [
    {
      id: 1,
      title: "Test Exam Batches",
      subtitle: "Prepare with Real Tests",
      bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/47610d0d-f770-4e43-a45b-53dc32d4fcd3.webp",
      link: "/courses/69c27646d9845979c707084c",
    },
    {
      id: 2,
      title: "Expert Coaching",
      subtitle: "Master Your Skills",
      bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/0e1c9a75-6d78-4225-a3ba-5817f80408a3.webp",
      link: "/courses",
    },
    {
      id: 3,
      title: "Limited Time Offer",
      
      subtitle: "50% OFF - Enroll Now",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/0e1c9a75-6d78-4225-a3ba-5817f80408a3.webp",
      link: "/courses",
    },
  ];

  const banners = customBanners || defaultBanners;

  useEffect(() => {
    if (!autoplay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(timer);
  }, [autoplay, banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setAutoplay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setAutoplay(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setAutoplay(false);
  };

  return (
    <motion.div
      className="banner-slider"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      <div className="banner-slides-container">
        {banners.map((banner, index) => {
          const slideContent = (
            <motion.div
              key={banner.id}
              className={`banner-slide ${index === currentSlide ? "active" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentSlide ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              style={{
                opacity: index === currentSlide ? 1 : 0,
                pointerEvents: index === currentSlide ? "auto" : "none",
              }}
            >
              {banner.imageUrl && (
                <motion.img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="banner-image"
                  loading="lazy"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={index === currentSlide ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.1, duration: 0.6 }}
                />
              )}

            </motion.div>
          );

          return banner.link ? (
            <Link key={banner.id} to={banner.link} style={{ textDecoration: "none" }}>
              {slideContent}
            </Link>
          ) : (
            slideContent
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {/* <button
        className="banner-nav-button banner-nav-prev"
        onClick={prevSlide}
        aria-label="Previous banner"
        type="button"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="banner-nav-button banner-nav-next"
        onClick={nextSlide}
        aria-label="Next banner"
        type="button"
      >
        <ChevronRight size={24} />
      </button> */}

      {/* Dots Navigation */}
      <div className="banner-dots">
        {banners.map((_, index) => (
          <motion.button
            key={index}
            className={`banner-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

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
    <>
      <BannerSlider />
      <section className="hero">
        <div className="hero-container">
          <motion.div 
            className="hero-left hero-content"
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
          className="hero-right"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="hero-card">
            <img src={teacherImage} alt="Expert coach" className="hero-card-image" />
            <div className="hero-card-overlay">
              <div className="hero-card-badge">Live coaching</div>
              <div className="hero-card-stats">
                <span>300+ LIVE classes</span>
                <span>5-star faculty</span>
                <span>Personalized support</span>
              </div>
            </div>
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
    </>
  );
};

export default Hero;