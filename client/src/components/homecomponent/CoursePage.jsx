import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Filter, Users, Star, Trophy } from "lucide-react";
import CourseCard from "./CourseCard";
import API from "../../utils/api";
import { resolveInstructorName } from "../../utils/courseIdentity";
import "./CoursePage.css";

function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const trustStats = [
    {
      icon: Star,
      value: "4.8/5",
      label: "Average student rating",
      tone: "gold",
    },
    {
      icon: Users,
      value: "10,000+",
      label: "Students enrolled",
      tone: "indigo",
    },
    {
      icon: Trophy,
      value: "500+",
      label: "Selections in top schools",
      tone: "green",
    },
  ];

  const getCourseImage = (thumbnail) => {
    if (!thumbnail) {
      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80";
    }

    if (String(thumbnail).startsWith("http")) {
      return thumbnail;
    }

    return `http://localhost:5000/${String(thumbnail).replace(/\\/g, "/")}`;
  };

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get("/courses");
        const parsedCourses = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        setCourses(parsedCourses);
      } catch (err) {
        setError("Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const extracted = courses
      .map((course) => course?.category?.trim())
      .filter(Boolean);

    return ["All", ...new Set(extracted)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (activeCategory === "All") {
      return courses;
    }

    return courses.filter((course) => (course?.category || "").trim() === activeCategory);
  }, [courses, activeCategory]);

  const resolveBadgeType = (course, index) => {
    const explicitBadge = String(course.badgeType || course.badge || "")
      .trim()
      .toLowerCase();

    const normalizedBadge =
      explicitBadge === "new batch"
        ? "new"
        : explicitBadge === "limited seats"
          ? "limited"
          : explicitBadge;

    const seatCount = Number(
      course.seatsLeft ?? course.availableSeats ?? course.remainingSeats
    );

    if (["popular", "new", "limited"].includes(normalizedBadge)) {
      return normalizedBadge;
    }

    if (course.popular || course.isPopular || index < 2) {
      return "popular";
    }

    if (Number.isFinite(seatCount) && seatCount > 0 && seatCount <= 25) {
      return "limited";
    }

    if (course.newBatch || course.isNewBatch || index % 3 === 0) {
      return "new";
    }

    return "";
  };

  return (
    <section className="course-page" id="courses">
      <div className="course-page-container">
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="course-kicker">
            <Sparkles size={15} />
            Popular Programs
          </p>
          <h2>Courses Designed for Real Exam Results</h2>
          <p>
            Structured batches, weekly tests, and mentor support to help students crack Navodaya and
            Sainik entrance exams with confidence.
          </p>
          <div className="course-cta-group">
            <Link to="/courses" className="btn btn-primary btn-lg">
              Explore All Courses
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-lg">
              Book Free Demo
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="course-trust-strip"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        >
          {trustStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article className={`course-trust-card course-trust-${stat.tone}`} key={stat.label}>
                <span className="course-trust-icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            );
          })}
        </motion.div>

        {!loading && !error && categories.length > 1 && (
          <motion.div
            className="course-filter-wrap"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <p className="course-filter-title">
              <Filter size={15} />
              Filter by category
            </p>
            <div className="course-filter-group">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`course-filter-btn${activeCategory === category ? " active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {loading && <div className="course-status course-status-loading">Loading courses...</div>}
        {error && <div className="course-status course-status-error">{error}</div>}

        {!loading && !error && filteredCourses.length === 0 && (
          <div className="course-status course-status-empty">No courses available in this category yet.</div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <div className="course-grid">
            {filteredCourses.slice(0, 6).map((course, index) => (
              <motion.div
                className="course-grid-item"
                key={course._id || `${course.title}-${index}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              >
                <CourseCard
                  image={getCourseImage(course.thumbnail)}
                  name={course.title}
                  description={course.description}
                  instructor={course.instructorName || course.teacherName || resolveInstructorName(course)}
                  category={course.category || "Exam Prep"}
                  price={course.price}
                  duration={course.duration || "Live + Recorded"}
                  courseId={course._id}
                  rating={course.rating || course.averageRating || 4.8}
                  studentsCount={
                    course.studentsCount ||
                    course.studentsEnrolled ||
                    course.enrollmentCount ||
                    course.totalStudents
                  }
                  language={course.language || "Hindi"}
                  mentorExperience={course.mentorExperience || "8+ yrs"}
                  tags={Array.isArray(course.tags) ? course.tags : undefined}
                  badgeType={resolveBadgeType(course, index)}
                  popular={Boolean(course.popular || course.isPopular || index < 2)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && filteredCourses.length > 6 && (
          <div className="course-more-wrap">
            <Link className="course-more-link" to="/courses">
              View all {filteredCourses.length} courses
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default CoursePage;