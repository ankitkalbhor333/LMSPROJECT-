import "./TestCard.css";

const TestCard = ({ test, onStart }) => {
  if (!test) return null;

  const handleStart = () => {
    if (onStart) {
      onStart(test);
    }
  };

  const questionCount = test.questions ? test.questions.length : 0;

  return (
    <div className="test-card">
      <div className="test-header">
        <h3>{test.title}</h3>
        <span className="subject-badge">{test.subject}</span>
      </div>
      <div className="test-details">
        <p className="questions"><strong>Questions:</strong> {questionCount}</p>
        <p className="time"><strong>Time Limit:</strong> {test.timeLimit} minutes</p>
      </div>
      <button className="start-btn" onClick={handleStart}>
        Start Test
      </button>
    </div>
  );
};

export default TestCard;