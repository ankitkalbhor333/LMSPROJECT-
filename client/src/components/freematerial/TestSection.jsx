import { useState, useEffect } from "react";
import TestCard from "./TestCard";
import API from "../../utils/api";
import "./TestSection.css";

const TestSection = ({ onStartTest }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all tests
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/freetests");
      setTests(response.data.data || []);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to load tests. Please try again.");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tests
  const filteredTests = tests.filter((test) => {
    const matchSubject = !selectedSubject || test.subject === selectedSubject;
    const matchSearch =
      !searchQuery ||
      test.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSubject && matchSearch;
  });

  // Get unique subjects
  const subjects = [...new Set(tests.map((t) => t.subject))];

  const handleReset = () => {
    setSelectedSubject("");
    setSearchQuery("");
  };

  const handleStartTest = async (test) => {
    try {
      // Fetch the test data without answers for student attempt
      const response = await API.get(`/freetests/${test._id}/attempt`);
      if (onStartTest) {
        onStartTest(response.data.data);
      }
    } catch (err) {
      console.error("Error starting test:", err);
      alert("Error loading test. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="test-section">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search tests by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters */}
      <div className="filters">
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
          {filteredTests.length} test{filteredTests.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Tests Grid */}
      {filteredTests.length > 0 ? (
        <div className="card-grid">
          {filteredTests.map((test) => (
            <TestCard
              key={test._id}
              test={test}
              onStart={handleStartTest}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No tests found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default TestSection;