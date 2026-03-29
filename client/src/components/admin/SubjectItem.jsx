import { useState } from "react";
import API from "../../utils/api";
import UnitItem from "./UnitItem";
import "./Subject.css";

function SubjectItem({ subject, courseId, onRefresh, onDelete, onSelectSubject, isFullScreen }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [units, setUnits] = useState(subject.units || []);

  const handleAddUnit = async (e) => {
    e.preventDefault();

    if (!unitTitle.trim()) {
      alert("Please enter unit title");
      return;
    }

    try {
      setSavingUnit(true);
      const response = await API.post("/units/create", {
        title: unitTitle,
        subjectId: subject._id,
      });

      // Update local units state instead of full refresh
      setUnits([...units, response.data]);
      setUnitTitle("");
      setShowAddUnit(false);
    } catch (err) {
      alert("Failed to add unit: " + (err.response?.data?.error || err.message));
      console.error("Error adding unit:", err);
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!window.confirm("Are you sure you want to delete this subject and all its units?")) {
      return;
    }

    try {
      setDeleting(true);
      await API.delete(`/subjects/${subject._id}`);
      onDelete(subject._id);
    } catch (err) {
      alert("Failed to delete subject: " + (err.response?.data?.error || err.message));
      console.error("Error deleting subject:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUnitDelete = (unitId) => {
    // Remove deleted unit from local units state, keeping modal open
    setUnits(units.filter(u => u._id !== unitId));
  };

  return (
    <div className={`subject-card ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      <div 
        className="subject-header"
        onClick={() => onSelectSubject && !isFullScreen && onSelectSubject(subject)}
        style={!isFullScreen ? { cursor: 'pointer' } : {}}
      >
        <button
          className="expansion-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <div className="subject-title-section">
          <h4 className="subject-title">{subject.title}</h4>
          <span className="units-count">
            {subject.units?.length || 0} unit{subject.units?.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="subject-actions">
          <button
            className="btn-icon btn-delete"
            onClick={handleDeleteSubject}
            disabled={deleting}
            title="Delete subject"
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="subject-content">
          <div className="units-section">
            <div className="units-header">
              <h5>Units</h5>
              <button
                className="btn btn-sm btn-success"
                onClick={() => setShowAddUnit(!showAddUnit)}
              >
                {showAddUnit ? "Cancel" : "+ Add Unit"}
              </button>
            </div>

            {showAddUnit && (
              <form className="add-unit-form" onSubmit={handleAddUnit}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter unit title..."
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  disabled={savingUnit}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingUnit}
                >
                  {savingUnit ? "Creating..." : "Create"}
                </button>
              </form>
            )}

            <div className="units-list">
              {units && units.length > 0 ? (
                units.map((unit) => (
                  <UnitItem
                    key={unit._id}
                    unit={unit}
                    subjectId={subject._id}
                    onRefresh={() => {
                      // Minimal refresh for unit-specific updates if needed
                    }}
                    onDelete={handleUnitDelete}
                  />
                ))
              ) : (
                <p className="empty-message">No units yet. Create one to get started!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectItem;
