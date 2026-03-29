import Subject from "../models/Subject.js";
import Course from "../models/Course.js";

export const createSubject = async (req, res) => {
  try {
    const { title, courseId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ error: "Title and courseId are required" });
    }

    const subject = await Subject.create({
      title,
      courseId
    });

    await Course.findByIdAndUpdate(
      courseId,
      { $push: { subjects: subject._id } }
    );

    res.status(201).json(subject);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const subjects = await Subject.find({ courseId }).populate("units");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate({
      path: "units",
      populate: {
        path: "lectures"
      }
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { title } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { title },
      { returnDocument: 'after' }
    );

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Remove from course
    await Course.findByIdAndUpdate(
      subject.courseId,
      { $pull: { subjects: subject._id } }
    );

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};