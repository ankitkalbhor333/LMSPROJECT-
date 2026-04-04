import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Clock3,
  Quote,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import StoryCard from "./StoryCard";
import "./StoryPage.css";

function StoryPage() {
  const stories = [
    {
      name: "Archana Chaudhary",
      batch: "Saarthi Batch",
      location: "Uttar Pradesh",
      badge: "JNV Selected",
      tone: "indigo",
      badgeTone: "indigo",
      scoreLift: "+31%",
      scoreBefore: "52%",
      scoreAfter: "83%",
      accuracyGain: "+18%",
      quote:
        "Mentor feedback and weekly mock analysis changed my confidence. I finally knew what to revise and when.",
      timeline: [
        {
          key: "struggle",
          icon: AlertCircle,
          label: "Struggle",
          detail: "Mock test pressure and low speed in Math kept score inconsistent.",
        },
        {
          key: "preparation",
          icon: BookOpen,
          label: "Preparation",
          detail: "Daily concept revision, mentor checkpoints, and timed weekly tests.",
        },
        {
          key: "result",
          icon: Trophy,
          label: "Result",
          detail: "Higher accuracy and calm exam-day execution led to final selection.",
        },
      ],
      description:
        "I followed the mentor plan step-by-step and improved my mock scores consistently before final selection.",
    },
    {
      name: "Aayansh",
      batch: "Saarthi Batch",
      location: "Basti, UP",
      badge: "JNV Selected",
      tone: "indigo",
      badgeTone: "indigo",
      scoreLift: "+27%",
      scoreBefore: "56%",
      scoreAfter: "78%",
      description:
        "Daily revision and weekly tests gave me confidence in exam pattern and made time management easier.",
    },
    {
      name: "Ayushman Raj",
      batch: "JNV Crash Course",
      location: "Bihar",
      badge: "Bihar Top Student",
      tone: "green",
      badgeTone: "gold",
      scoreLift: "+34%",
      scoreBefore: "48%",
      scoreAfter: "82%",
      description:
        "Focused crash strategy and mentor guidance helped me strengthen weak chapters and rank higher.",
    },
    
   
    {
      name: "Vikram Singh",
      batch: "Saarthi Batch",
      location: "Rajasthan",
      badge: "JNV Selected",
      tone: "green",
      badgeTone: "green",
      scoreLift: "+25%",
      scoreBefore: "57%",
      scoreAfter: "82%",
      description:
        "The teachers solved every doubt quickly and helped me build a strong exam routine with discipline.",
    },
  ];

  const spotlightStory = stories[0];
  const storyCards = stories.slice(1, 6);

  const gridVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: 0.08,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="story-page" id="story-page">
      <div className="story-container">
        <motion.div
          className="story-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="top-label">
            <Sparkles size={14} />
            Story Page
          </span>
          <h2>
            Real Journeys From
            <span> Preparation to Selection</span>
          </h2>
          <p>
            Every selection story follows a strong system: consistency, mentor guidance, mock analysis,
            and smart revision.
          </p>

          <div className="story-trust-strip" role="list" aria-label="Trust metrics">
            <span className="story-trust-pill story-trust-pill-gold" role="listitem">
              <Star size={14} />
              <strong>4.8/5</strong>
              Parent Rating
            </span>
            <span className="story-trust-pill" role="listitem">
              <TrendingUp size={14} />
              <strong>1000+</strong>
              Selections
            </span>
            <span className="story-trust-pill story-trust-pill-green" role="listitem">
              <Target size={14} />
              <strong>85%</strong>
              Improved Mock Scores
            </span>
          </div>
        </motion.div>

        <div className="story-layout">
          <motion.article
            className="story-spotlight"
            initial={{ opacity: 0, x: -22, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.005 }}
          >
            <div className="story-spotlight-layer" aria-hidden="true" />

            <div className="story-spotlight-head">
              <span className="story-spotlight-badge">Spotlight Story</span>
              <span className="story-spotlight-lift">
                <TrendingUp size={14} />
                {spotlightStory.scoreLift} score lift
              </span>
            </div>

            <h3>{spotlightStory.name}</h3>
            <p>{spotlightStory.description}</p>

            <div className="story-spotlight-metrics" role="list" aria-label="Performance gains">
              <div role="listitem">
                <span>Mock Score</span>
                <strong>
                  {spotlightStory.scoreBefore} to {spotlightStory.scoreAfter}
                </strong>
              </div>
              <div role="listitem">
                <span>Accuracy Gain</span>
                <strong>{spotlightStory.accuracyGain}</strong>
              </div>
              <div role="listitem">
                <span>Final Outcome</span>
                <strong>{spotlightStory.badge}</strong>
              </div>
            </div>

            <div className="story-spotlight-progress" aria-label="Before and after score progression">
              <div className="story-progress-line">
                <span>Before Mentorship</span>
                <strong>{spotlightStory.scoreBefore}</strong>
              </div>
              <div className="story-progress-track">
                <span style={{ width: spotlightStory.scoreBefore }} />
              </div>

              <div className="story-progress-line story-progress-line-after">
                <span>After Mentorship</span>
                <strong>{spotlightStory.scoreAfter}</strong>
              </div>
              <div className="story-progress-track story-progress-track-after">
                <span style={{ width: spotlightStory.scoreAfter }} />
              </div>
            </div>

            <blockquote className="story-spotlight-quote">
              <Quote size={16} />
              <p>{spotlightStory.quote}</p>
            </blockquote>

            <div className="story-timeline" aria-label="Success timeline">
              {spotlightStory.timeline.map((step) => {
                const StepIcon = step.icon;

                return (
                  <div className="story-timeline-item" key={step.label}>
                    <span className={`story-timeline-dot story-timeline-dot-${step.key}`}>
                      <StepIcon size={14} />
                    </span>
                    <div>
                      <p className="story-timeline-label">{step.label}</p>
                      <p className="story-timeline-text">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="story-spotlight-support" aria-label="Key preparation levers">
              <h4>What Drove Her Selection</h4>
              <div className="story-spotlight-support-grid">
                <div className="story-support-card">
                  <span className="story-support-icon" aria-hidden="true">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p>Daily Study Rhythm</p>
                    <small>90-minute concept cycles + timed practice blocks.</small>
                  </div>
                </div>

                <div className="story-support-card">
                  <span className="story-support-icon" aria-hidden="true">
                    <Target size={14} />
                  </span>
                  <div>
                    <p>Weekly Mentor Checkpoints</p>
                    <small>Mock-by-mock feedback, error tracking, and strategy correction.</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="story-spotlight-grid">
              <div>
                <span>Batch</span>
                <strong>{spotlightStory.batch}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{spotlightStory.location}</strong>
              </div>
              <div>
                <span>Result</span>
                <strong>{spotlightStory.badge}</strong>
              </div>
              <div>
                <span>Score Lift</span>
                <strong>{spotlightStory.scoreLift}</strong>
              </div>
            </div>
          </motion.article>

          <motion.div
            className="story-grid"
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-70px" }}
          >
            {storyCards.map((story) => (
              <motion.div
                key={`${story.name}-${story.location}`}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <StoryCard
                  name={story.name}
                  batch={story.batch}
                  location={story.location}
                  badge={story.badge}
                  scoreLift={story.scoreLift}
                  scoreBefore={story.scoreBefore}
                  scoreAfter={story.scoreAfter}
                  tone={story.tone}
                  badgeTone={story.badgeTone}
                  description={story.description}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="story-cta-block"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span className="story-cta-kicker">Admissions Open</span>
          <span className="story-cta-urgency">
            <Clock3 size={14} />
            Limited seats: only 120 left for this cycle
          </span>
          <h3>Turn Today&apos;s Preparation Into Tomorrow&apos;s Selection Story</h3>
          <p>
            Give your child a mentor-led roadmap with weekly tests, chapter-level analytics, and focused
            revision support from day one.
          </p>
          <p className="story-cta-note">
            Next batch starts soon. Book a free counseling session before admissions close.
          </p>

          <div className="story-cta-row">
            <Link to="/contact" className="btn btn-primary btn-lg">
              Book Free Demo
              <ArrowRight size={16} />
            </Link>
            <Link to="/courses" className="btn btn-secondary btn-lg">
              Explore Programs
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default StoryPage;