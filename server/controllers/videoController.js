import Videos from "../models/Videos.js";
import fs from "fs";
import path from "path";

/**
 * @desc    Upload new video
 * @route   POST /api/videos
 * @access  Private (Admin)
 */
export const uploadVideo = async (req, res) => {
  try {
    const { title, className, exam, subject, duration, teacher } = req.body;

    // Validate required fields
    if (!title || !className || !exam || !subject || !teacher) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, className, exam, subject, and teacher",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a video file",
      });
    }

    const newVideo = new Videos({
      title,
      className,
      exam,
      subject,
      duration: duration || "0:00",
      teacher,
      videoUrl: `/uploads/videos/${req.file.filename}`,
    });

    await newVideo.save();

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: newVideo,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error uploading video:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading video",
      error: error.message || error.toString(),
      details: error.code || "Unknown error occurred",
    });
  }
};

/**
 * @desc    Get all videos
 * @route   GET /api/videos
 * @access  Public
 */
export const getAllVideos = async (req, res) => {
  try {
    const { className, exam, subject, sortBy = "createdAt" } = req.query;

    let filter = {};

    if (className) {
      filter.className = className;
    }

    if (exam) {
      filter.exam = exam;
    }

    if (subject) {
      filter.subject = subject;
    }

    const videos = await Videos.find(filter).sort({ [sortBy]: -1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: error.message,
    });
  }
};

/**
 * @desc    Get videos by class
 * @route   GET /api/videos/class/:className
 * @access  Public
 */
export const getVideosByClass = async (req, res) => {
  try {
    const { className } = req.params;

    const videos = await Videos.find({ className });

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found for this class",
      });
    }

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos by class:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: error.message,
    });
  }
};

/**
 * @desc    Get videos by exam
 * @route   GET /api/videos/exam/:exam
 * @access  Public
 */
export const getVideosByExam = async (req, res) => {
  try {
    const { exam } = req.params;

    const videos = await Videos.find({ exam });

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found for this exam",
      });
    }

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos by exam:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: error.message,
    });
  }
};

/**
 * @desc    Get videos by subject
 * @route   GET /api/videos/subject/:subject
 * @access  Public
 */
export const getVideosBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const videos = await Videos.find({ subject });

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found for this subject",
      });
    }

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos by subject:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Public
 */
export const getVideoById = async (req, res) => {
  try {
    const video = await Videos.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching video",
      error: error.message,
    });
  }
};

/**
 * @desc    Update video
 * @route   PUT /api/videos/:id
 * @access  Private (Admin)
 */
export const updateVideo = async (req, res) => {
  try {
    const { title, className, exam, subject, duration, teacher } = req.body;

    let video = await Videos.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // If new file is uploaded, delete old file and update
    if (req.file) {
      const oldFilePath = path.join("uploads/videos", path.basename(video.videoUrl));
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error("Error deleting old file:", err);
      });

      video.videoUrl = `/uploads/videos/${req.file.filename}`;
    }

    if (title) video.title = title;
    if (className) video.className = className;
    if (exam) video.exam = exam;
    if (subject) video.subject = subject;
    if (duration) video.duration = duration;
    if (teacher) video.teacher = teacher;

    await video.save();

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error updating video:", error);
    res.status(500).json({
      success: false,
      message: "Error updating video",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Admin)
 */
export const deleteVideo = async (req, res) => {
  try {
    const video = await Videos.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Delete file from server
    const filePath = path.join("uploads/videos", path.basename(video.videoUrl));
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    await Videos.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting video",
      error: error.message,
    });
  }
};

/**
 * @desc    Search videos by title
 * @route   GET /api/videos/search/:query
 * @access  Public
 */
export const searchVideos = async (req, res) => {
  try {
    const { query } = req.params;

    const videos = await Videos.find({
      $or: [
        { title: new RegExp(query, "i") },
        { subject: new RegExp(query, "i") },
        { teacher: new RegExp(query, "i") },
      ],
    });

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found matching your search",
      });
    }

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error searching videos:", error);
    res.status(500).json({
      success: false,
      message: "Error searching videos",
      error: error.message,
    });
  }
};

/**
 * @desc    Add YouTube video to free material
 * @route   POST /api/videos/:id/youtube
 * @access  Private/Admin
 */
export const addYoutubeToVideo = async (req, res) => {
  try {
    const { youtubeId, youtubeLink, youtubeEmbedUrl } = req.body;
    const videoId = req.params.id;

    console.log("Adding YouTube video to free material:", { videoId, youtubeId, youtubeLink });

    // Validate required fields
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: "YouTube video ID is required",
      });
    }

    // Validate YouTube ID format (11 characters, alphanumeric + - _)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      console.error("Invalid YouTube ID format:", youtubeId, "Length:", youtubeId.length);
      return res.status(400).json({
        success: false,
        message: `Invalid YouTube video ID format. Expected 11 characters, got ${youtubeId.length}. Video ID must contain only alphanumeric characters, hyphens, and underscores.`,
      });
    }

    // Build embed URL if not provided
    const embedUrl = youtubeEmbedUrl || `https://www.youtube-nocookie.com/embed/${youtubeId}`;

    // Update video with YouTube data
    const video = await Videos.findByIdAndUpdate(
      videoId,
      {
        youtubeId,
        youtubeLink,
        youtubeEmbedUrl: embedUrl,
        videoSource: 'youtube',
      },
      { returnDocument: 'after' }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    console.log("YouTube video added successfully:", videoId);

    res.status(200).json({
      success: true,
      message: "YouTube video added to free material successfully",
      data: video,
    });
  } catch (error) {
    console.error("Error adding YouTube video to free material:", error);
    res.status(500).json({
      success: false,
      message: "Error adding YouTube video to free material",
      error: error.message,
    });
  }
};

/**
 * @desc    Create free material video with YouTube link
 * @route   POST /api/videos/create-youtube
 * @access  Private/Admin
 */
export const createYoutubeVideo = async (req, res) => {
  try {
    const { title, className, exam, subject, duration, teacher, youtubeLink } = req.body;

    // Validate required fields
    if (!title || !className || !exam || !subject || !teacher || !youtubeLink) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields including YouTube link",
      });
    }

    // Extract YouTube ID from URL
    const youtubeIdMatch = youtubeLink.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!youtubeIdMatch || !youtubeIdMatch[1]) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL format",
      });
    }

    const youtubeId = youtubeIdMatch[1];

    // Validate YouTube ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube video ID format",
      });
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;

    const newVideo = new Videos({
      title,
      className,
      exam,
      subject,
      duration: duration || "0:00",
      teacher,
      youtubeId,
      youtubeLink,
      youtubeEmbedUrl: embedUrl,
      videoSource: 'youtube',
    });

    await newVideo.save();

    console.log("YouTube free material video created successfully:", newVideo._id);

    res.status(201).json({
      success: true,
      message: "YouTube free material video created successfully",
      data: newVideo,
    });
  } catch (error) {
    console.error("Error creating YouTube free material video:", error);
    res.status(500).json({
      success: false,
      message: "Error creating YouTube free material video",
      error: error.message || error.toString(),
    });
  }
};
