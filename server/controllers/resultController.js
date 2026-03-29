import Result from "../models/Result.js";
import Test from "../models/Test.js";

/**
 * Get My Results (Student)
 */
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate("test", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch results" });
  }
};

/**
 * Get All Results (Admin Only)
 */
export const getAllResults = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const results = await Result.find()
      .populate("student", "name email phone studentProfile")
      .populate("test", "title")
      .sort({ percentage: -1 })
      .lean();

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all results" });
  }
};

/**
 * Leaderboard (Top 10)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const results = await Result.find({ test: req.params.testId })
      .populate("student", "name")
      .sort({ percentage: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

/**
 * Submit Result
 */
export const submitResult = async (req, res) => {
  try {
    const { testId, answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        message: "Invalid answers format",
      });
    }

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const alreadyAttempted = await Result.findOne({
      student: req.user._id,
      test: testId,
    });

    if (alreadyAttempted) {
      return res.status(400).json({
        message: "You have already attempted this test",
      });
    }

    let score = 0;

    test.questions.forEach((q) => {
      const userAnswer = answers[q._id.toString()];
      if (userAnswer === q.correctAnswer) score++;
    });

    const totalQuestions = test.questions.length;
    const percentage = (score / totalQuestions) * 100;

    const result = await Result.create({
      student: req.user._id,
      test: testId,
      score,
      totalQuestions,
      percentage,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
