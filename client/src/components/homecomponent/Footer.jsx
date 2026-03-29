import "./footer.css";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import logo1 from "../../assets/logo1.png";

const courseLinks = [
  { label: "Navodaya Exam", to: "/courses" },
  { label: "Sainik School", to: "/courses" },
  { label: "RMS Preparation", to: "/courses" },
  { label: "Foundation Programs", to: "/courses" },
  { label: "Mock Test Series", to: "/courses" },
];

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Free Materials", to: "/freematerial" },
  { label: "Contact", to: "/contact" },
];

const legalLinks = [
  "Privacy Policy",
  "Terms & Conditions",
  "Refund Policy",
  "Disclaimer",
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-box">
              <img src={logo1} alt="Balaji Ranker logo" className="footer-logo" />
            </div>

            <p className="footer-description">
              India's trusted online coaching platform for Navodaya and Sainik school entrance exams.
            </p>

            <p className="footer-description secondary">
              Structured courses, mentor-led guidance, and measurable results since 2016.
            </p>

            <div className="footer-brand-stats">
              <span>10,000+ Students</span>
              <span>500+ Selections</span>
              <span>4.8/5 Rating</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h3>Our Courses</h3>
              <ul>
                {courseLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h3>Quick Links</h3>
              <ul>
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h3>Legal</h3>
              <ul>
                {legalLinks.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-support-card">
            <h3>Talk to Counsellor</h3>

            <a href="tel:+917610879108" className="footer-contact-item">
              <Phone size={15} />
              +91 7610879108
            </a>

            <a href="mailto:support@balajiranker.com" className="footer-contact-item">
              <Mail size={15} />
              support@balajiranker.com
            </a>

            <p className="footer-contact-item muted">
              <MapPin size={15} />
              Mon-Sat | 9:00 AM - 9:00 PM
            </p>

            <Link to="/contact" className="footer-support-btn">
              Book Free Demo
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} Balaji Ranker. All rights reserved.</p>

        <div className="footer-socials" aria-label="Social links">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
            <Facebook size={17} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={17} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
            <Youtube size={17} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
            <Twitter size={17} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;