import Unit from "../models/Unit.js";
import Subject from "../models/Subject.js";

export const createUnit = async (req, res) => {
  try {
    const { title, subjectId } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ error: "Title and subjectId are required" });
    }

    const unit = await Unit.create({
      title,
      subjectId
    });

    await Subject.findByIdAndUpdate(
      subjectId,
      { $push: { units: unit._id } }
    );

    res.status(201).json(unit);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnitsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const units = await Unit.find({ subjectId: courseId }).populate("lectures");
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate("lectures");

    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { title } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { title },
      { returnDocument: 'after' }
    );

    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);

    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Remove from subject
    await Subject.findByIdAndUpdate(
      unit.subjectId,
      { $pull: { units: unit._id } }
    );

    res.json({ message: "Unit deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};