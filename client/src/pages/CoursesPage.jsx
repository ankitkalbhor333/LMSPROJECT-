import React, { useState, useEffect } from "react";
import CourseCard from "../components/homecomponent/CourseCard";
import API from "../utils/api";
import { resolveInstructorName } from "../utils/courseIdentity";
import "../styles/CoursesPage.css";

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [categories, setCategories] = useState([]);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get("/courses");
        console.log("📚 Courses fetched:", response.data);
        const parsedCourses = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        setCourses(parsedCourses);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(
            parsedCourses
              .map((course) => course?.category)
              .filter((category) => Boolean(category))
          ),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("❌ Error fetching courses:", err);
        setError("Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter and sort courses
  useEffect(() => {
    let filtered = Array.isArray(courses) ? [...courses] : [];
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    // Filter by search query
    if (normalizedSearchQuery) {
      filtered = filtered.filter(
        (course) =>
          String(course?.title || "").toLowerCase().includes(normalizedSearchQuery) ||
          String(course?.description || "").toLowerCase().includes(normalizedSearchQuery) ||
          resolveInstructorName(course, "")
            .toLowerCase()
            .includes(normalizedSearchQuery)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((course) => course?.category === selectedCategory);
    }

    // Sort courses
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest") {
      filtered = [...filtered].reverse();
    }
    // 'popular' is default, no additional sorting needed

    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("popular");
  };

  return (
    <div className="courses-page">
      {/* Hero Section */}
      <div className="courses-hero">
        <div className="hero-content">
          <h1>Explore Our Professional Courses</h1>
          <p>
            Learn from industry experts and advance your career with our
            comprehensive course collection
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="courses-filters-wrapper">
        <div className="courses-filters">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search courses, instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls">
            {/* Category Filter */}
            <div className="filter-group">
              <label htmlFor="category-select">Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="filter-group">
              <label htmlFor="sort-select">Sort By:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="reset-btn"
              title="Reset all filters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="courses-container">
        {/* Results Info */}
        {!loading && (
          <div className="results-info">
            <p>
              Showing <strong>{filteredCourses.length}</strong> of{" "}
              <strong>{courses.length}</strong> courses
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <p className="error-message">
              ⚠️ {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Courses State */}
        {!loading && courses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No Courses Available</h2>
            <p>Check back soon for new courses!</p>
          </div>
        )}

        {/* No Results State */}
        {!loading && courses.length > 0 && filteredCourses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No Courses Found</h2>
            <p>Try adjusting your filters or search query</p>
            <button
              onClick={handleResetFilters}
              className="reset-link"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && filteredCourses.length > 0 && (
          <div className="courses-page-grid">
            {filteredCourses.map((course) => (
              <div key={course?._id || course?.title} className="course-grid-item">
                <CourseCard
                  image={
                    course?.thumbnail
                      ? `${import.meta.env.VITE_API_URL || 'https://lmsproject-8suc.onrender.com'}/${course.thumbnail}`
                      : "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  name={course.title}
                  description={course.description}
                  instructor={resolveInstructorName(course)}
                  category={course.category}
                  price={course.price}
                  duration={course.duration}
                  courseId={course._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!loading && filteredCourses.length > 0 && (
        <div className="courses-footer">
          <p>
            Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export default CoursesPage;
