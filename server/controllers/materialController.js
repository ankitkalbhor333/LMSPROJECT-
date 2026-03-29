import Material from "../models/Material.js";
import Lecture from "../models/Lecture.js";
import fs from "fs";
import path from "path";

/**
 * @desc    Upload new material
 * @route   POST /api/materials/upload
 * @access  Private (Admin)
 */
export const uploadMaterial = async (req, res) => {
  try {
    const { lectureId, title, type } = req.body;

    // Validate required fields
    if (!lectureId || !title) {
      return res.status(400).json({
        success: false,
        message: "Please provide lectureId and title",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    // Validate lectureId is a valid MongoDB ObjectId
    if (!lectureId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lectureId format",
      });
    }

    // Get file size in MB
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;

    const newMaterial = new Material({
      lectureId,
      title,
      fileUrl: `/uploads/materials/${req.file.filename}`,
      type: type || req.file.mimetype,
      fileSize,
    });

    await newMaterial.save();

    // Add material ID to lecture's materials array
    await Lecture.findByIdAndUpdate(
      lectureId,
      { $push: { materials: newMaterial._id } }
    );

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      data: newMaterial,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error uploading material:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading material",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * @desc    Create material without file
 * @route   POST /api/materials/create
 * @access  Private (Admin)
 */
export const createMaterial = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, fileUrl } = req.body;

    const material = new Material({ lectureId, title, fileUrl });
    await material.save();

    // Add material ID to lecture's materials array
    await Lecture.findByIdAndUpdate(
      lectureId,
      { $push: { materials: material._id } }
    );

    res.status(201).json(material);
  } catch (error) {
    console.error("Error creating material:", error);
    res.status(500).json({ message: "Failed to create material" });
  }
};

/**
 * @desc    Add Vimeo video to lecture
 * @route   POST /api/materials/add-vimeo
 * @access  Private (Admin)
 */
export const addVimeoVideo = async (req, res) => {
  try {
    const { lectureId, title, vimeoId, vimeoLink, embedUrl } = req.body;

    // Validate required fields
    if (!lectureId || !title || !vimeoId) {
      return res.status(400).json({
        success: false,
        message: "Please provide lectureId, title, and vimeoId",
      });
    }

    // Validate lectureId is a valid MongoDB ObjectId
    if (!lectureId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lectureId format",
      });
    }

    const newMaterial = new Material({
      lectureId,
      title,
      vimeoId,
      vimeoLink,
      embedUrl,
      videoSource: 'vimeo',
      type: 'video/vimeo', // Custom type for Vimeo videos
    });

    await newMaterial.save();

    // Add material ID to lecture's materials array
    await Lecture.findByIdAndUpdate(
      lectureId,
      { $push: { materials: newMaterial._id } }
    );

    res.status(201).json({
      success: true,
      message: "Vimeo video added successfully",
      data: newMaterial,
    });
  } catch (error) {
    console.error("Error adding Vimeo video:", error);
    res.status(500).json({
      success: false,
      message: "Error adding Vimeo video",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * @desc    Get all materials for a lecture (Course Builder)
 * @route   GET /api/courses/lectures/:lectureId/materials
 * @access  Public
 */
export const getMaterials = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const materials = await Material.find({ lectureId });

    res.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
};

/**
 * @desc    Get all materials for a lecture
 * @route   GET /api/materials/lecture/:lectureId
 * @access  Public
 */
export const getMaterialsByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const materials = await Material.find({ lectureId }).sort({
      createdAt: -1,
    });

    if (!materials || materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No materials found for this lecture",
      });
    }

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching materials",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single material by ID
 * @route   GET /api/materials/:id
 * @access  Public
 */
export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching material",
      error: error.message,
    });
  }
};

/**
 * @desc    Update material
 * @route   PUT /api/materials/:id
 * @access  Private (Admin)
 */
export const updateMaterial = async (req, res) => {
  try {
    const { title, type } = req.body;

    let material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    // If new file is uploaded, delete old file and update
    if (req.file) {
      const oldFilePath = path.join(
        "uploads/materials",
        path.basename(material.fileUrl)
      );
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error("Error deleting old file:", err);
      });

      material.fileUrl = `/uploads/materials/${req.file.filename}`;
      material.fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    if (title) material.title = title;
    if (type) material.type = type;

    await material.save();

    res.status(200).json({
      success: true,
      message: "Material updated successfully",
      data: material,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error updating material:", error);
    res.status(500).json({
      success: false,
      message: "Error updating material",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private (Admin)
 */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({ 
        success: false,
        message: "Material not found" 
      });
    }

    const lectureId = material.lectureId;

    // Remove material from lecture's materials array
    await Lecture.findByIdAndUpdate(
      lectureId,
      { $pull: { materials: id } }
    );

    // Delete the material
    await Material.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Material deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete material",
      error: error.message
    });
  }
};

/**
 * @desc    Increment download count for material
 * @route   PUT /api/materials/:id/download
 * @access  Public
 */
export const downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: 'after' }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Download count incremented",
      data: material,
    });
  } catch (error) {
    console.error("Error incrementing download count:", error);
    res.status(500).json({
      success: false,
      message: "Error incrementing download count",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all materials (with optional filtering)
 * @route   GET /api/materials
 * @access  Public
 */
export const getAllMaterials = async (req, res) => {
  try {
    const { type, sortBy = "createdAt" } = req.query;

    let filter = {};

    if (type) {
      filter.type = type;
    }

    const materials = await Material.find(filter).sort({ [sortBy]: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching materials",
      error: error.message,
    });
  }
};
