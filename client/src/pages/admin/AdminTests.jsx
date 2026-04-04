import React, { useEffect, useState } from "react";
import API from "../../utils/api";
import "./AdminTests.css";

const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    course: "",
    duration: "",
    questions: [],
  });

  // ===========================
  // Fetch All Tests
  // ===========================
  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/tests/list");
      setTests(data);
      setError("");
    } catch (err) {
      setError("Failed to load tests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Fetch Courses (for dropdown)
  // ===========================
  const fetchCourses = async () => {
    try {
      const { data } = await API.get("/courses");
      setCourses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchCourses();
  }, []);

  // ===========================
  // Handle Form Change
  // ===========================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===========================
  // Add Question
  // ===========================
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updated });
  };

  // ===========================
  // Submit (Create / Edit)
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.course || !formData.duration) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    try {
      setLoading(true);
      if (editingTest) {
        await API.put(`/tests/${editingTest._id}`, formData);
        setSuccess("Test updated successfully!");
      } else {
        await API.post("/tests/create", formData);
        setSuccess("Test created successfully!");
      }

      fetchTests();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving test");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Delete Test
  // ===========================
  // Delete Test
  // ===========================
  const deleteTest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      setLoading(true);
      await API.delete(`/tests/${id}`);
      setSuccess("Test deleted successfully!");
      fetchTests();
    } catch (err) {
      setError("Error deleting test");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Edit Test
  // ===========================
  const editTest = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      course: test.course._id || test.course,
      duration: test.duration,
      questions: test.questions,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTest(null);
    setFormData({ title: "", course: "", duration: "", questions: [] });
    setError("");
  };

  // ===========================
  // Filter Tests
  // ===========================
  const filteredTests = tests.filter((test) =>
    test.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-tests-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">📝 Test Management</h1>
          <p className="admin-subtitle">Create, manage, and organize your tests</p>
        </div>
        <button 
          className="btn-create"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          ➕ Create New Test
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" role="alert">
          <strong>✗ Error:</strong> {error}
          <button className="close-btn" onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          <strong>✓ Success:</strong> {success}
          <button className="close-btn" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search tests by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-count">{filteredTests.length} tests found</span>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Tests Table - Responsive Table/Grid */}
      {!loading && (
        <div className="data-container">
          {filteredTests.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="table-wrapper">
                <table className="tests-table">
                  <thead>
                    <tr>
                      <th className="col-title">Test Title</th>
                      <th className="col-course">Course</th>
                      <th className="col-duration">Duration</th>
                      <th className="col-questions">Questions</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map((test) => (
                      <tr key={test._id} className="table-row">
                        <td className="col-title">
                          <span className="test-title-badge">{test.title}</span>
                        </td>
                        <td className="col-course">
                          {test.course?.title || "N/A"}
                        </td>
                        <td className="col-duration">
                          <span className="duration-badge">{test.duration} min</span>
                        </td>
                        <td className="col-questions">
                          <span className="question-count">{test.questions?.length || 0}</span>
                        </td>
                        <td className="col-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => editTest(test)}
                            disabled={loading}
                            title="Edit test"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => deleteTest(test._id)}
                            disabled={loading}
                            title="Delete test"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="tests-grid">
                {filteredTests.map((test) => (
                  <div key={test._id} className="test-card">
                    <div className="card-header">
                      <h3 className="card-title">{test.title}</h3>
                    </div>
                    <div className="card-body">
                      <div className="card-row">
                        <span className="card-label">Course:</span>
                        <span className="card-value">{test.course?.title || "N/A"}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Duration:</span>
                        <span className="duration-badge">{test.duration} min</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Questions:</span>
                        <span className="question-count">{test.questions?.length || 0}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => editTest(test)}
                        disabled={loading}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => deleteTest(test._id)}
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>📚 No tests found. Create your first test to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTest ? "Edit Test" : "Create New Test"}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="test-form">
              {/* Basic Info */}
              <div className="form-section">
                <h3 className="section-title">📋 Basic Information</h3>

                <div className="form-group">
                  <label className="form-label">Test Title *</label>
                  <input
                    className="form-input"
                    name="title"
                    placeholder="e.g., JavaScript Fundamentals"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Duration (minutes) *</label>
                    <input
                      className="form-input"
                      name="duration"
                      type="number"
                      placeholder="e.g., 30"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">❓ Questions ({formData.questions.length})</h3>
                  <button
                    type="button"
                    className="btn-add-question"
                    onClick={addQuestion}
                  >
                    + Add Question
                  </button>
                </div>

                <div className="questions-list">
                  {formData.questions.length > 0 ? (
                    formData.questions.map((q, qIndex) => (
                      <div key={qIndex} className="question-card">
                        <div className="question-header">
                          <span className="question-number">Question {qIndex + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-question"
                            onClick={() => removeQuestion(qIndex)}
                            title="Remove question"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="question-input-group">
                          <label className="form-label">Question Text *</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Enter the question"
                            value={q.question}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, "question", e.target.value)
                            }
                            required
                            rows="2"
                          />
                        </div>

                        <div className="options-group">
                          <label className="form-label">Answer Options *</label>
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="option-input">
                              <input
                                className="form-input"
                                placeholder={`Option ${oIndex + 1}`}
                                value={opt}
                                onChange={(e) =>
                                  handleOptionChange(qIndex, oIndex, e.target.value)
                                }
                                required
                              />
                              <span className={`option-letter ${q.correctAnswer === oIndex ? 'correct' : ''}`}>
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="correct-answer-group">
                          <label className="form-label">Correct Answer *</label>
                          <select
                            className="form-select"
                            value={q.correctAnswer}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIndex,
                                "correctAnswer",
                                parseInt(e.target.value)
                              )
                            }
                            required
                          >
                            {[0, 1, 2, 3].map((index) => (
                              <option key={index} value={index}>
                                Option {index + 1} - {q.options[index] || "Empty"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-questions">
                      <p>No questions added yet. Click "Add Question" to start.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingTest ? "Update Test" : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;