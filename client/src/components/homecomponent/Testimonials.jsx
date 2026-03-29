import { motion } from "framer-motion";
import { Quote, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import "./testimonials.css";

const testimonials = [
  {
    name: "Ankita Verma",
    context: "Parent, Class 6 Aspirant",
    highlight: "Structured learning plan",
    rating: 4.9,
    review:
      "Weekly progress reports helped us understand exactly where to focus. The platform feels professional and reliable.",
  },
  {
    name: "Ritika Sharma",
    context: "JNV Selected, 2025 Batch",
    highlight: "Strong mock-test strategy",
    rating: 4.8,
    review:
      "Mock tests and mentor feedback improved my speed and accuracy. I walked into the exam with confidence.",
  },
  {
    name: "Mohit Kumar",
    context: "Sainik School Selected",
    highlight: "Concept clarity + revision",
    rating: 4.8,
    review:
      "Lessons were clear, revision modules were practical, and doubts were solved quickly. It felt like real exam coaching.",
  },
  {
    name: "Sushma Devi",
    context: "Parent, Bihar",
    highlight: "Mentor support",
    rating: 4.9,
    review:
      "We always got timely guidance from mentors. The learning dashboard made tracking preparation very easy.",
  },
  {
    name: "Nitin Raj",
    context: "Saarthi Batch Student",
    highlight: "Mobile-first convenience",
    rating: 4.7,
    review:
      "I studied mostly on phone and still stayed consistent. The platform is smooth and very easy to use daily.",
  },
  {
    name: "Pooja Singh",
    context: "JNV Final Round Qualifier",
    highlight: "High trust experience",
    rating: 4.8,
    review:
      "From onboarding to final revision, everything is organized. You can tell this is built like a serious edtech platform.",
  },
];

const getInitials = (name = "") => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "ST";
};

const summaryItems = [
  {
    icon: Star,
    value: "4.8/5",
    label: "Average review score",
    tone: "gold",
  },
  {
    icon: Users,
    value: "1000+",
    label: "Verified student reviews",
    tone: "indigo",
  },
  {
    icon: TrendingUp,
    value: "92%",
    label: "Improved mock performance",
    tone: "green",
  },
  {
    icon: ShieldCheck,
    value: "Trusted",
    label: "Parent-first guidance model",
    tone: "slate",
  },
];

function Testimonials() {
  return (
    <section className="home-testimonials" id="testimonials">
      <div className="home-testimonials-container">
        <motion.div
          className="home-testimonials-head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="home-testimonials-kicker">Testimonials</p>
          <h2>Families Trust the Process, Students Trust the Results</h2>
          <p>
            Real feedback from students and parents who experienced structured preparation for Navodaya
            and Sainik exams.
          </p>
        </motion.div>

        <motion.div
          className="home-testimonials-summary"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        >
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className={`home-summary-card home-summary-${item.tone}`} key={item.label}>
                <span className="home-summary-icon" aria-hidden="true">
                  <Icon size={15} />
                </span>
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </article>
            );
          })}
        </motion.div>

        <div className="home-testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <motion.article
              className="home-testimonial-card"
              key={`${testimonial.name}-${testimonial.context}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.04 }}
            >
              <div className="home-testimonial-top">
                <span className="home-testimonial-quote" aria-hidden="true">
                  <Quote size={16} />
                </span>
                <span className="home-testimonial-rating" aria-label={`Rated ${testimonial.rating || 4.8} out of 5`}>
                  <span className="home-testimonial-stars">★★★★★</span>
                  <span className="home-testimonial-score">{(testimonial.rating || 4.8).toFixed(1)}/5</span>
                </span>
              </div>

              <p className="home-testimonial-review">
                <span className="home-testimonial-inline-quote" aria-hidden="true">“</span>
                {testimonial.review}
                <span className="home-testimonial-inline-quote" aria-hidden="true">”</span>
              </p>

              <div className="home-testimonial-bottom">
                <div className="home-testimonial-author">
                  <span className="home-testimonial-avatar" aria-hidden="true">
                    {getInitials(testimonial.name)}
                  </span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.context}</span>
                  </div>
                </div>
                <span className="home-testimonial-tag">{testimonial.highlight}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;