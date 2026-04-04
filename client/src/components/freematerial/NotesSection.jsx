import { useState, useEffect } from "react";
import NoteCard from "./NoteCard";
import API from "../../utils/api";
import "./NotesSection.css";

const NotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all notes
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/notes");
      setNotes(response.data.data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes. Please try again.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchSubject = !selectedSubject || note.subject === selectedSubject;
    const matchChapter = !selectedChapter || note.chapter === selectedChapter;
    const matchSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSubject && matchChapter && matchSearch;
  });

  // Get unique values for filters
  const subjects = [...new Set(notes.map((n) => n.subject))];
  const chapters = [...new Set(notes.map((n) => n.chapter))];

  const handleReset = () => {
    setSelectedSubject("");
    setSelectedChapter("");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-section">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search notes by title..."
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

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Chapters</option>
          {chapters.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter}
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
          {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="card-grid">
          {filteredNotes.map((note) => (
            <NoteCard key={note._id} note={note} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No notes found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default NotesSection;