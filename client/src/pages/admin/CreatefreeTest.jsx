import { useState } from "react";
import API from "../../utils/api";
import "./FreeMatUpload.css";

const CreateFreeTest = () => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    timeLimit: "",
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].question = value;
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].correctAnswer = parseInt(value);
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        questions: newQuestions,
      });
    }
  };

  const addOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push("");
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length > 2) {
      newQuestions[qIndex].options.splice(oIndex, 1);

      // Adjust correctAnswer if needed
      if (newQuestions[qIndex].correctAnswer >= newQuestions[qIndex].options.length) {
        newQuestions[qIndex].correctAnswer = newQuestions[qIndex].options.length - 1;
      }

      setFormData({
        ...formData,
        questions: newQuestions,
      });
    }
  };

  const validateForm = () => {
    // Check basic fields
    if (!formData.title.trim()) {
      setError("Please enter test title");
      return false;
    }

    if (!formData.subject.trim()) {
      setError("Please enter subject");
      return false;
    }

    if (!formData.timeLimit || parseInt(formData.timeLimit) <= 0) {
      setError("Please enter valid time limit (minutes must be positive)");
      return false;
    }

    if (formData.questions.length === 0) {
      setError("Please add at least one question");
      return false;
    }

    // Validate each question
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];

      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Please enter question text`);
        return false;
      }

      const filledOptions = q.options.filter((opt) => opt.trim());
      if (filledOptions.length < 2) {
        setError(`Question ${i + 1}: Minimum 2 options required`);
        return false;
      }

      const allOptionsFilled = q.options.every((opt) => opt.trim());
      if (!allOptionsFilled) {
        setError(`Question ${i + 1}: All option fields must be filled`);
        return false;
      }

      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        setError(`Question ${i + 1}: Please select a valid correct answer`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare test data matching server expectations
      const testData = {
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        timeLimit: parseInt(formData.timeLimit),
        questions: formData.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((opt) => opt.trim()),
          correctAnswer: q.correctAnswer,
        })),
      };

      // Send to server
      const response = await API.post("/freetests", testData);

      setSuccess("Test created successfully!");

      // Reset form
      setFormData({
        title: "",
        subject: "",
        timeLimit: "",
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
          },
        ],
      });

      // Auto-dismiss success message
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error creating test:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error creating test. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>Create Free Test</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="upload-form test-form">
          {/* Test Basic Information */}
          <div className="form-row">
            <div className="form-group">
              <label>Test Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics Final Exam"
                required
              />
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics, English, Science"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Time Limit (minutes) *</label>
            <input
              type="number"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleInputChange}
              placeholder="e.g., 60"
              min="1"
              max="300"
              required
            />
          </div>

          {/* Questions Section */}
          <div className="questions-section">
            <h3>Questions ({formData.questions.length})</h3>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
              Add questions with at least 2 options each. Select the correct answer for each question.
            </p>

            {formData.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                {/* Question Header */}
                <div className="question-header">
                  <h4>Question {qIndex + 1}</h4>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="btn-remove"
                      title="Remove this question"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    placeholder="Enter the question text..."
                    rows="3"
                    required
                  />
                </div>

                {/* Options Section */}
                <div className="options-section">
                  <label>Options * (minimum 2, maximum 6)</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-row">
                      <div className="option-wrapper">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(qIndex, oIndex, e.target.value)
                          }
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="btn-remove-option"
                            title="Remove this option"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="correct-answer-check">
                        <input
                          type="radio"
                          name={`correct-answer-${qIndex}`}
                          value={oIndex}
                          checked={question.correctAnswer === oIndex}
                          onChange={(e) =>
                            handleCorrectAnswerChange(qIndex, e.target.value)
                          }
                          required
                        />
                        <label>Correct</label>
                      </div>
                    </div>
                  ))}

                  {/* Add Option Button */}
                  {question.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="btn-add-option"
                      title="Add another option to this question"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <button
              type="button"
              onClick={addQuestion}
              className="btn-add-question"
              title="Add a new question to the test"
            >
              + Add Question
            </button>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Creating Test..." : "Create Test"}
          </button>
        </form>

        {/* Form Summary */}
        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #e0e0e0",
            fontSize: "13px",
            color: "#666",
          }}
        >
          <p>
            <strong>Summary:</strong> {formData.questions.length} question(s),{" "}
            {formData.timeLimit || "0"} minute(s)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateFreeTest;
