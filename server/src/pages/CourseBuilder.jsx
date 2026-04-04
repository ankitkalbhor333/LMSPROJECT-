import { useState, useEffect } from "react";
import API from "../utils/api";
import SubjectItem from "../components/admin/SubjectItem";
import "./CourseBuilder.css";

function CourseBuilder({ courseId }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectTitle, setSubjectTitle] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!courseId) {
      setError("Missing course ID");
      setLoading(false);
      return;
    }

    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/courses/builder/${courseId}`);
      const courseResponse = res.data || null;

      setCourse(courseResponse);
      setSubjects(Array.isArray(courseResponse?.subjects) ? courseResponse.subjects : []);
      setSelectedSubject(null);
    } catch (err) {
      setError("Failed to load course: " + (err.response?.data?.message || err.message));
      console.error("Error fetching course:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();

    if (!subjectTitle.trim()) {
      alert("Please enter subject title");
      return;
    }

    try {
      setSavingSubject(true);
      const response = await API.post("/subjects/create", {
        title: subjectTitle,
        courseId: courseId,
      });

      // Add to local subjects state instead of full refresh
      setSubjects([...subjects, response.data]);
      setSubjectTitle("");
      setShowAddSubject(false);
    } catch (err) {
      alert("Failed to add subject: " + (err.response?.data?.error || err.message));
      console.error("Error adding subject:", err);
    } finally {
      setSavingSubject(false);
    }
  };

  const handleSubjectDelete = (subjectId) => {
    // Remove deleted subject from local subjects state
    setSubjects(subjects.filter(s => s._id !== subjectId));
    // Close fullscreen if the deleted subject was selected
    if (selectedSubject && selectedSubject._id === subjectId) {
      setSelectedSubject(null);
    }
  };

  if (loading) {
    return (
      <div className="course-builder">
        <div className="loading-spinner">Loading course structure...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="course-builder">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchCourse}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="course-builder">
      <div className="course-header">
        <div className="course-info">
          <h2>{course?.title}</h2>
          <p className="course-description">{course?.description}</p>
        </div>
        <button
          className="btn btn-success"
          onClick={() => setShowAddSubject(!showAddSubject)}
        >
          {showAddSubject ? "Cancel" : "+ Add Subject"}
        </button>
      </div>

      {showAddSubject && (
        <form className="add-subject-form" onSubmit={handleAddSubject}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter subject title..."
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              disabled={savingSubject}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingSubject}
            >
              {savingSubject ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="subjects-grid">
        {subjects && subjects.length > 0 ? (
          subjects.map((subject) => (
            <div
              key={subject._id}
              className="subject-wrapper"
              onClick={() => setSelectedSubject(subject)}
            >
              <SubjectItem
                subject={subject}
                courseId={courseId}
                onRefresh={fetchCourse}
                onDelete={handleSubjectDelete}
                onSelectSubject={() => setSelectedSubject(subject)}
                isFullScreen={false}
              />
              <div className="fullscreen-overlay">
                Click to Expand →
              </div>
            </div>
          ))
        ) : (
          <div className="no-subjects">
            <p>No subjects yet. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Fullscreen Subject Modal */}
      {selectedSubject && (
        <div className="fullscreen-modal-overlay" onClick={() => setSelectedSubject(null)}>
          <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-modal-header">
              <h3>{selectedSubject.title} Units</h3>
              <button
                className="btn-close"
                onClick={() => setSelectedSubject(null)}
                title="Close fullscreen view"
              >
                ✕
              </button>
            </div>
            <div className="fullscreen-modal-body">
              <SubjectItem
                subject={selectedSubject}
                courseId={courseId}
                onRefresh={() => {
                  // Update selected subject with refreshed data
                  fetchCourse();
                }}
                onDelete={handleSubjectDelete}
                isFullScreen={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseBuilder;
