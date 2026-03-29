import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import "./AttemptTest.css";
function AttemptTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes (in seconds)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/tests/${id}`);
      setTest(res.data);
    } catch (error) {
      console.error("Error loading test:", error);
      setError(error.response?.data?.message || "Failed to load test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    try {
      // Convert answers object to array format expected by server
      const answerArray = test.questions.map((q) => answers[q._id] !== undefined ? answers[q._id] : null);

      await API.post(`/tests/submit/${id}`, {
        answers: answerArray,
      });

      alert("Test Submitted Successfully!");
      navigate("/dashboard");

    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting test. You may have already attempted this test.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return <h3 className="text-center mt-5">Loading Test...</h3>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-2"
            onClick={() => navigate("/student-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return <h3 className="text-center mt-5">Test not found</h3>;
  }

  return (
    <div className="container mt-4">

      {/* TIMER BOX */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{test.title}</h2>
        <div className="bg-danger text-white px-3 py-2 rounded">
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      {test.questions.map((q, index) => (
        <div key={q._id} className="card mb-3 shadow-sm">
          <div className="card-body">
            <h5>Q{index + 1}. {q.question}</h5>

            {q.options.map((opt, i) => (
              <div key={i} className="form-check">
                <input
                  type="radio"
                  name={q._id}
                  className="form-check-input"
                  onChange={() => handleOptionSelect(q._id, i)}
                  checked={answers[q._id] === i}
                />
                <label className="form-check-label">{opt}</label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="btn btn-success mt-3"
      >
        Submit Test
      </button>

    </div>
  );
}

export default AttemptTest;