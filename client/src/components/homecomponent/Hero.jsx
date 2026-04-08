import "./hero.css"
import teacherImage from "../../assets/teacherImage.png";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Users, Trophy, Award } from "lucide-react";
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
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/4608a449-61b3-454c-bbef-20bb98cadd09.jpg",
    },
    {
      id: 2,
      title: "Expert Coaching",
      subtitle: "Master Your Skills",
      bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/44e37d3a-a8b1-4a4d-90a4-55404311c810.jpg",
    },
    {
      id: 3,
      title: "Limited Time Offer",
      subtitle: "50% OFF - Enroll Now",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      imageUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/GLOBAL_CMS/27ec202b-cffe-4679-9310-480f8f626caf.jpg",
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
        {banners.map((banner, index) => (
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
                initial={{ opacity: 0, scale: 1.05 }}
                animate={index === currentSlide ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1, duration: 0.6 }}
              />
            )}

          </motion.div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
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
      </button>

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
      
      {/* Modern Clean Hero Section */}
      <section className="hero-modern">
        <div className="hero-modern-container">
          
          {/* Left Content - Text & CTA */}
          <motion.div 
            className="hero-modern-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Headline with Gradient */}
            <motion.h1 
              className="hero-modern-title"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              Master your
              <span className="gradient-highlight"> Navodaya & Sainik</span>
              {' '}School Entrance Exams
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="hero-modern-subtitle"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              Join thousands of successful students. Expert-led online and offline coaching for JNVST and Sainik School entrance exams.
            </motion.p>

            {/* Trust Badges */}
            <motion.div 
              className="hero-modern-trust"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="trust-badge">
                <Star size={18} className="badge-icon" />
                <div className="badge-content">
                  <div className="badge-value">4.8/5</div>
                  <div className="badge-label">Rating</div>
                </div>
              </div>
              
              <div className="trust-badge">
                <Users size={18} className="badge-icon" />
                <div className="badge-content">
                  <div className="badge-value">1000+</div>
                  <div className="badge-label">Students</div>
                </div>
              </div>
              
              <div className="trust-badge">
                <Trophy size={18} className="badge-icon" />
                <div className="badge-content">
                  <div className="badge-value">500+</div>
                  <div className="badge-label">Selections</div>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="hero-modern-buttons"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link to="/courses" className="btn-modern btn-modern-primary">
                Explore Courses
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              
              <Link to="/contact" className="btn-modern btn-modern-secondary">
                Book Free Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div 
            className="hero-modern-image"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            viewport={{ once: true }}
          >
            <img src={teacherImage} alt="Expert Coaching" className="modern-hero-img" />
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Hero;