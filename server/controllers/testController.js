import Test from "../models/Test.js";
import Result from "../models/Result.js";

/**
 * Create Test (Admin Only)
 */
export const createTest = async (req, res) => {
  try {
    const { title, course, duration, questions } = req.body;

    const test = await Test.create({
      title,
      course,
      duration,
      questions,
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: "Error creating test" });
  }
};

/**
 * Get Test by ID (removes correct answers for students)
 */
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Remove correctAnswer before sending
    const questions = test.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
    }));

    res.json({
      _id: test._id,
      title: test.title,
      duration: test.duration,
      questions,
    });
  } catch (error) {
    console.error("Error fetching test:", error);
    res.status(500).json({ message: "Error fetching test" });
  }
};

/**
 * Submit Test and Calculate Score
 */
export const submitTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Prevent Multiple Attempts
    const existingResult = await Result.findOne({
      student: req.user._id,
      test: req.params.id,
    });

    if (existingResult) {
      return res.status(400).json({
        message: "You have already attempted this test",
      });
    }

    const { answers } = req.body;

    let score = 0;

    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    const percentage = ((score / test.questions.length) * 100).toFixed(2);

    await Result.create({
      student: req.user._id,
      test: test._id,
      score,
      totalQuestions: test.questions.length,
      percentage,
    });

    res.json({
      message: "Test submitted",
      score,
      total: test.questions.length,
      percentage: `${percentage}%`,
    });

  } catch (error) {
    res.status(500).json({ message: "Submission failed" });
  }
};

/**
 * Get My Results (Student Dashboard)
 */
export const getMyResults = async (req, res) => {
  const results = await Result.find({ student: req.user._id })
    .populate("test", "title")
    .sort({ createdAt: -1 });

  res.json(results);
};

/**
 * Get All Tests (for students to see available tests)
 */
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate("course", "title")
      .select("_id title course duration questions");
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

/**
 * Get All Results (Admin Only)
 */
export const getAllResults = async (req, res) => {
  const results = await Result.find()
    .populate("student", "name email phone studentProfile")
    .populate("test", "title")
    .sort({ createdAt: -1 });

  res.json(results);
};

/**
 * Update Test (Admin Only)
 */
export const updateTest = async (req, res) => {
  try {
    const { title, course, duration, questions } = req.body;

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { title, course, duration, questions },
      { returnDocument: 'after' }
    );

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json(test);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating test" });
  }
};

/**
 * Delete Test (Admin Only)
 */
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting test" });
  }
};