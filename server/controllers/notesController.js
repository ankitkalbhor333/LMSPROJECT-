import Note from "../models/Note.js";
import fs from "fs";
import path from "path";

/**
 * @desc    Upload new notes
 * @route   POST /api/notes
 * @access  Private (Admin)
 */
export const uploadNotes = async (req, res) => {
  try {
    const { title, subject, chapter } = req.body;

    // Validate required fields
    if (!title || !subject || !chapter) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, subject, and chapter",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    // Get file size in MB
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;

    const newNote = new Note({
      title,
      subject,
      chapter,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      fileSize,
    });

    await newNote.save();

    res.status(201).json({
      success: true,
      message: "Notes uploaded successfully",
      data: newNote,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error uploading notes:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading notes",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all notes
 * @route   GET /api/notes
 * @access  Public
 */
export const getAllNotes = async (req, res) => {
  try {
    const { subject, chapter, sortBy = "createdAt" } = req.query;

    let filter = {};

    if (subject) {
      filter.subject = subject;
    }

    if (chapter) {
      filter.chapter = chapter;
    }

    const notes = await Note.find(filter).sort({ [sortBy]: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notes",
      error: error.message,
    });
  }
};

/**
 * @desc    Get notes by subject
 * @route   GET /api/notes/subject/:subject
 * @access  Public
 */
export const getNotesBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const notes = await Note.find({ subject });

    if (!notes || notes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No notes found for this subject",
      });
    }

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching notes by subject:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notes",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Public
 */
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching note",
      error: error.message,
    });
  }
};

/**
 * @desc    Update notes
 * @route   PUT /api/notes/:id
 * @access  Private (Admin)
 */
export const updateNotes = async (req, res) => {
  try {
    const { title, subject, chapter } = req.body;

    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // If new file is uploaded, delete old file and update
    if (req.file) {
      const oldFilePath = path.join("uploads/notes", path.basename(note.fileUrl));
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error("Error deleting old file:", err);
      });

      note.fileUrl = `/uploads/notes/${req.file.filename}`;
      note.fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    if (title) note.title = title;
    if (subject) note.subject = subject;
    if (chapter) note.chapter = chapter;

    await note.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error updating note:", error);
    res.status(500).json({
      success: false,
      message: "Error updating note",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete notes
 * @route   DELETE /api/notes/:id
 * @access  Private (Admin)
 */
export const deleteNotes = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Delete file from server
    const filePath = path.join("uploads/notes", path.basename(note.fileUrl));
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting note",
      error: error.message,
    });
  }
};

/**
 * @desc    Increment download count
 * @route   PUT /api/notes/:id/download
 * @access  Public
 */
export const downloadNotes = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: 'after' }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Download count incremented",
      data: note,
    });
  } catch (error) {
    console.error("Error updating download count:", error);
    res.status(500).json({
      success: false,
      message: "Error updating download count",
      error: error.message,
    });
  }
};
