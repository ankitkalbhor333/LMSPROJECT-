import FreeTest from "../models/FreeTest.js";

/**
 * @desc    Create/Upload new test
 * @route   POST /api/freetests
 * @access  Private (Admin)
 */
export const createTest = async (req, res) => {
  try {
    const { title, subject, timeLimit, questions } = req.body;

    // Validate required fields
    if (!title || !subject || !timeLimit || !questions) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, subject, timeLimit, and questions",
      });
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions must be a non-empty array",
      });
    }

    // Validate each question
    for (let question of questions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Each question must have text and at least 2 options",
        });
      }

      if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
        return res.status(400).json({
          success: false,
          message: "Each question must have a valid correctAnswer index",
        });
      }
    }

    const newTest = new FreeTest({
      title,
      subject,
      timeLimit,
      questions,
    });

    await newTest.save();

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: newTest,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({
      success: false,
      message: "Error creating test",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all tests
 * @route   GET /api/freetests
 * @access  Public
 */
export const getAllTests = async (req, res) => {
  try {
    const { subject, sortBy = "createdAt" } = req.query;

    let filter = {};

    if (subject) {
      filter.subject = subject;
    }

    const tests = await FreeTest.find(filter).sort({ [sortBy]: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tests",
      error: error.message,
    });
  }
};

/**
 * @desc    Get tests by subject
 * @route   GET /api/freetests/subject/:subject
 * @access  Public
 */
export const getTestsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const tests = await FreeTest.find({ subject });

    if (!tests || tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tests found for this subject",
      });
    }

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests by subject:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tests",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single test by ID
 * @route   GET /api/freetests/:id
 * @access  Public
 */
export const getTestById = async (req, res) => {
  try {
    const test = await FreeTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error("Error fetching test:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching test",
      error: error.message,
    });
  }
};

/**
 * @desc    Update test
 * @route   PUT /api/freetests/:id
 * @access  Private (Admin)
 */
export const updateTest = async (req, res) => {
  try {
    const { title, subject, timeLimit, questions } = req.body;

    let test = await FreeTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Validate questions if provided
    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Questions must be a non-empty array",
        });
      }

      for (let question of questions) {
        if (!question.question || !Array.isArray(question.options) || question.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: "Each question must have text and at least 2 options",
          });
        }

        if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          return res.status(400).json({
            success: false,
            message: "Each question must have a valid correctAnswer index",
          });
        }
      }

      test.questions = questions;
    }

    if (title) test.title = title;
    if (subject) test.subject = subject;
    if (timeLimit) test.timeLimit = timeLimit;

    await test.save();

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).json({
      success: false,
      message: "Error updating test",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete test
 * @route   DELETE /api/freetests/:id
 * @access  Private (Admin)
 */
export const deleteTest = async (req, res) => {
  try {
    const test = await FreeTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    await FreeTest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting test",
      error: error.message,
    });
  }
};

/**
 * @desc    Get test with randomized options (don't expose answers)
 * @route   GET /api/freetests/:id/attempt
 * @access  Public
 */
export const getTestForAttempt = async (req, res) => {
  try {
    const test = await FreeTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Create a copy without revealing correct answers
    const testForAttempt = {
      _id: test._id,
      title: test.title,
      subject: test.subject,
      timeLimit: test.timeLimit,
      questions: test.questions.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        // Don't include correctAnswer
      })),
    };

    res.status(200).json({
      success: true,
      data: testForAttempt,
    });
  } catch (error) {
    console.error("Error fetching test for attempt:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching test",
      error: error.message,
    });
  }
};

/**
 * @desc    Submit free test answers and calculate score (no auth)
 * @route   POST /api/freetests/:id/submit
 * @access  Public
 */
export const submitFreeTest = async (req, res) => {
  try {
    const test = await FreeTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const { answers } = req.body; // expected: { 0: 1, 1: 2, ... }

    let score = 0;
    const totalQuestions = test.questions.length;

    test.questions.forEach((q, idx) => {
      const selected = answers ? answers[idx] : undefined;
      if (selected !== undefined && selected === q.correctAnswer) {
        score++;
      }
    });

    const percentage = ((score / totalQuestions) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      score,
      total: totalQuestions,
      percentage,
    });
  } catch (error) {
    console.error("Error submitting free test:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting test",
      error: error.message,
    });
  }
};
