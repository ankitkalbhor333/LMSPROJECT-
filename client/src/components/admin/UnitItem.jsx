import { useState } from "react";
import API from "../../utils/api";
import LectureItem from "./LectureItem";
import "./Unit.css";

function UnitItem({ unit, subjectId, onRefresh, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [savingLecture, setSavingLecture] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lectures, setLectures] = useState(unit.lectures || []);

  const handleAddLecture = async (e) => {
    e.preventDefault();

    if (!lectureTitle.trim()) {
      alert("Please enter lecture title");
      return;
    }

    try {
      setSavingLecture(true);
      const res = await API.post("/lectures/create", {
        title: lectureTitle,
        unitId: unit._id,
      });

      // Add to local lectures state instead of full refresh
      setLectures([...lectures, res.data]);
      setLectureTitle("");
      setShowAddLecture(false);
    } catch (err) {
      alert("Failed to add lecture: " + (err.response?.data?.error || err.message));
      console.error("Error adding lecture:", err);
    } finally {
      setSavingLecture(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!window.confirm("Are you sure you want to delete this unit and all its lectures?")) {
      return;
    }

    try {
      setDeleting(true);
      await API.delete(`/units/${unit._id}`);
      
      // Notify parent to remove from local state
      if (onDelete) {
        onDelete(unit._id);
      } else {
        // Fallback to refresh if onDelete not provided
        onRefresh();
      }
    } catch (err) {
      alert("Failed to delete unit: " + (err.response?.data?.error || err.message));
      console.error("Error deleting unit:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleLectureDelete = (lectureId) => {
    // Remove deleted lecture from local lectures state
    setLectures(lectures.filter(l => l._id !== lectureId));
  };

  return (
    <div className="unit-card">
      <div className="unit-header">
        <button
          className="expansion-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "⬇" : "▶"}
        </button>
        <div className="unit-info">
          <h5 className="unit-title">{unit.title}</h5>
          <span className="lectures-count">
            {unit.lectures?.length || 0} lecture{unit.lectures?.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="unit-actions">
          <button
            className="btn-icon btn-delete"
            onClick={handleDeleteUnit}
            disabled={deleting}
            title="Delete unit"
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="unit-content">
          <div className="lectures-section">
            <div className="lectures-header">
              <h6>Lectures</h6>
              <button
                className="btn btn-sm btn-info"
                onClick={() => setShowAddLecture(!showAddLecture)}
              >
                {showAddLecture ? "Cancel" : "+ Add Lecture"}
              </button>
            </div>

            {showAddLecture && (
              <form className="add-lecture-form" onSubmit={handleAddLecture}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter lecture title..."
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  disabled={savingLecture}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingLecture}
                >
                  {savingLecture ? "Creating..." : "Create"}
                </button>
              </form>
            )}

            <div className="lectures-list">
              {lectures && lectures.length > 0 ? (
                lectures.map((lecture) => (
                  <LectureItem
                    key={lecture._id}
                    lecture={lecture}
                    unitId={unit._id}
                    onRefresh={onRefresh}
                    onDelete={handleLectureDelete}
                  />
                ))
              ) : (
                <p className="empty-message">No lectures yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnitItem;
