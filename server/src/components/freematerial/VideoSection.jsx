import { useState, useEffect } from "react";
import VideoCard from "./VideoCard";
import API from "../../utils/api";
import "./VideoSection.css";

const VideoSection = ({ onPlayVideo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/videos");
      setVideos(response.data.data || []);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos. Please try again.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter videos based on selected filters and search
  const filteredVideos = videos.filter((video) => {
    const matchClass = !selectedClass || video.className === selectedClass;
    const matchExam = !selectedExam || video.exam === selectedExam;
    const matchSubject = !selectedSubject || video.subject === selectedSubject;
    const matchSearch =
      !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.teacher.toLowerCase().includes(searchQuery.toLowerCase());

    return matchClass && matchExam && matchSubject && matchSearch;
  });

  // Get unique values for filter options
  const classes = [...new Set(videos.map((v) => v.className))];
  const exams = [...new Set(videos.map((v) => v.exam))];
  const subjects = [...new Set(videos.map((v) => v.subject))];

  const handleReset = () => {
    setSelectedClass("");
    setSelectedExam("");
    setSelectedSubject("");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="video-section">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search videos by title or teacher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="filter-select"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="filter-select"
        >
          <option value="">All Exams</option>
          {exams.map((exam) => (
            <option key={exam} value={exam}>
              {exam}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="filter-select"
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <button onClick={handleReset} className="reset-btn">
          Reset Filters
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Results Count */}
      <div className="results-info">
        <p>
          {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="card-grid">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onPlay={onPlayVideo}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No videos found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default VideoSection;