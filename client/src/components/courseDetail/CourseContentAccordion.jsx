import { useEffect, useMemo, useState } from "react";
import { Clock3, PlayCircle } from "lucide-react";

const toSelectKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const removeSubjectPrefix = (unitTitle, subjectTitle) => {
  const normalizedUnitTitle = String(unitTitle || "").trim();
  const normalizedSubjectTitle = String(subjectTitle || "").trim();

  if (!normalizedSubjectTitle) {
    return normalizedUnitTitle;
  }

  const lowerUnit = normalizedUnitTitle.toLowerCase();
  const lowerSubject = normalizedSubjectTitle.toLowerCase();

  if (lowerUnit.startsWith(`${lowerSubject} >`)) {
    return normalizedUnitTitle.slice(normalizedSubjectTitle.length + 1).replace(/^\s*>\s*/, "").trim();
  }

  if (lowerUnit.startsWith(`${lowerSubject} -`)) {
    return normalizedUnitTitle.slice(normalizedSubjectTitle.length + 1).replace(/^\s*-\s*/, "").trim();
  }

  return normalizedUnitTitle;
};

function CourseContentAccordion({ units }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");

  const subjectGroups = useMemo(() => {
    const grouped = new Map();

    units.forEach((unit, unitIndex) => {
      const rawSubjectTitle = String(unit?.subject || "").trim() || "General";
      const subjectKey = toSelectKey(rawSubjectTitle) || `subject-${unitIndex}`;
      const subjectId = `subject-${subjectKey}`;

      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, {
          id: subjectId,
          title: rawSubjectTitle,
          units: [],
        });
      }

      const cleanUnitTitle =
        removeSubjectPrefix(unit?.title || `Unit ${unitIndex + 1}`, rawSubjectTitle) || `Unit ${unitIndex + 1}`;

      grouped.get(subjectId).units.push({
        ...unit,
        title: cleanUnitTitle,
      });
    });

    return Array.from(grouped.values());
  }, [units]);

  useEffect(() => {
    if (!subjectGroups.length) {
      setSelectedSubjectId("");
      return;
    }

    setSelectedSubjectId((current) =>
      subjectGroups.some((subject) => subject.id === current) ? current : subjectGroups[0].id
    );
  }, [subjectGroups]);

  const selectedSubject = useMemo(
    () => subjectGroups.find((subject) => subject.id === selectedSubjectId) || null,
    [subjectGroups, selectedSubjectId]
  );

  const subjectUnits = selectedSubject?.units || [];

  useEffect(() => {
    if (!subjectUnits.length) {
      setSelectedUnitId("");
      return;
    }

    setSelectedUnitId((current) => (subjectUnits.some((unit) => unit.id === current) ? current : subjectUnits[0].id));
  }, [subjectUnits]);

  const selectedUnit = useMemo(
    () => subjectUnits.find((unit) => unit.id === selectedUnitId) || null,
    [subjectUnits, selectedUnitId]
  );

  const unitLectures = selectedUnit?.lectures || [];

  useEffect(() => {
    if (!unitLectures.length) {
      setSelectedLectureId("");
      return;
    }

    if (selectedLectureId && unitLectures.some((lecture) => lecture.id === selectedLectureId)) {
      return;
    }

    setSelectedLectureId("");
  }, [unitLectures, selectedLectureId]);

  const displayedLectures = useMemo(() => {
    if (!selectedLectureId) {
      return unitLectures;
    }

    return unitLectures.filter((lecture) => lecture.id === selectedLectureId);
  }, [unitLectures, selectedLectureId]);

  const totalLectures = useMemo(
    () => units.reduce((count, unit) => count + unit.lectures.length, 0),
    [units]
  );

  return (
    <section className="cd-surface cd-section">
      <div className="cd-section-head">
        <h2>Course Content</h2>
        <p>
          {units.length} units, {totalLectures} lectures
        </p>
      </div>

      {units.length === 0 ? (
        <p className="cd-empty-text">Course modules will appear once curriculum data is available.</p>
      ) : (
        <div className="cd-content-dropdowns" aria-label="Course content dropdown navigation">
          <div className="cd-select-grid">
            <label className="cd-select-field">
              <span className="cd-select-label">Subject</span>
              <select
                className="cd-select"
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
              >
                {subjectGroups.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="cd-select-field">
              <span className="cd-select-label">Unit</span>
              <select
                className="cd-select"
                value={selectedUnitId}
                onChange={(event) => setSelectedUnitId(event.target.value)}
                disabled={!subjectUnits.length}
              >
                {subjectUnits.length === 0 ? <option value="">No units available</option> : null}
                {subjectUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="cd-select-field">
              <span className="cd-select-label">Lecture</span>
              <select
                className="cd-select"
                value={selectedLectureId}
                onChange={(event) => setSelectedLectureId(event.target.value)}
                disabled={!unitLectures.length}
              >
                <option value="">All lectures</option>
                {unitLectures.map((lecture) => (
                  <option key={lecture.id} value={lecture.id}>
                    {lecture.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cd-content-selection-meta">
            <p>
              {selectedSubject?.title || "General"} {"->"} {selectedUnit?.title || "Unit"} {"->"}{" "}
              {selectedLectureId
                ? displayedLectures[0]?.title || "Lecture"
                : `${displayedLectures.length} lecture${displayedLectures.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <ul
            className="cd-lecture-list"
            aria-label={`Lectures for ${selectedUnit?.title || selectedSubject?.title || "selected unit"}`}
          >
            {displayedLectures.length === 0 ? (
              <li className="cd-lecture-empty">No lectures listed yet.</li>
            ) : (
              displayedLectures.map((lecture) => (
                <li className="cd-lecture-item" key={lecture.id}>
                  <span className="cd-lecture-name">
                    <PlayCircle size={14} />
                    {lecture.title}
                  </span>
                  <span className="cd-lecture-meta">
                    {lecture.isPreview ? <span className="cd-lecture-preview-badge">Preview</span> : null}
                    <span className="cd-lecture-duration">
                      <Clock3 size={13} />
                      {lecture.duration}
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

export default CourseContentAccordion;
