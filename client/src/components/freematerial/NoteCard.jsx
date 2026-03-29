import API from "../../utils/api";
import "./NoteCard.css";

const NoteCard = ({ note, onDownload }) => {
  if (!note) return null;

  const backendBase = API.defaults.baseURL
    ? API.defaults.baseURL.replace(/\/api\/*$/, "")
    : "http://localhost:5000";

  const getFileLink = () => {
    if (!note.fileUrl) return "";
    return note.fileUrl.startsWith("http")
      ? note.fileUrl
      : `${backendBase}${note.fileUrl}`;
  };

  const handleDownload = async () => {
    try {
      // Increment download counter
      await API.put(`/notes/${note._id}/download`);
      
      // Download the file
      if (onDownload) {
        onDownload(note);
      } else {
        window.open(getFileLink(), "_blank");
      }
    } catch (error) {
      console.error("Error downloading note:", error);
      alert("Error downloading file");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="note-card">
      <div className="note-header">
        <h3>{note.title}</h3>
        <span className="subject-badge">{note.subject}</span>
      </div>
      <div className="note-details">
        <p><strong>Chapter:</strong> {note.chapter}</p>
        <p><strong>Size:</strong> {note.fileSize}</p>
        <p><strong>Downloads:</strong> {note.downloads || 0}</p>
        <p><strong>Updated:</strong> {formatDate(note.updatedAt)}</p>
      </div>
      <div className="card-buttons">
        <button
          className="preview-btn"
          onClick={() => window.open(getFileLink(), "_blank")}
        >
          Preview
        </button>
        <button className="download-btn" onClick={handleDownload}>Download</button>
      </div>
    </div>
  );
};

export default NoteCard;