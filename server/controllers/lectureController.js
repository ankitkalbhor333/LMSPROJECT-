import Lecture from "../models/Lecture.js";
import Unit from "../models/Unit.js";

export const createLecture = async (req, res) => {
  try {
    const { title, unitId } = req.body;

    if (!title || !unitId) {
      return res.status(400).json({ error: "Title and unitId are required" });
    }

    const lecture = await Lecture.create({
      title,
      unitId
    });

    await Unit.findByIdAndUpdate(
      unitId,
      { $push: { lectures: lecture._id } }
    );

    res.status(201).json(lecture);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLecturesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const lectures = await Lecture.find({ unitId });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLecture = async (req, res) => {
  try {
    const { title, videoUrl, duration } = req.body;
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { title, videoUrl, duration },
      { returnDocument: 'after' }
    );

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    // Remove from unit
    await Unit.findByIdAndUpdate(
      lecture.unitId,
      { $pull: { lectures: lecture._id } }
    );

    res.json({ message: "Lecture deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reorderLectures = async (req, res) => {
  try {
    const { lectures } = req.body;

    for (let lecture of lectures) {
      await Lecture.findByIdAndUpdate(
        lecture.id,
        { order: lecture.order }
      );
    }

    res.json({ message: "Lectures reordered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Add YouTube video to lecture
 * @route   POST /api/lectures/:id/youtube
 * @access  Private/Admin
 */
export const addYoutubeToLecture = async (req, res) => {
  try {
    const { youtubeId, youtubeLink, youtubeEmbedUrl } = req.body;
    const lectureId = req.params.id;

    console.log("Adding YouTube video to lecture:", { lectureId, youtubeId, youtubeLink });

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

    // Update lecture with YouTube data
    const lecture = await Lecture.findByIdAndUpdate(
      lectureId,
      {
        youtubeId,
        youtubeLink,
        youtubeEmbedUrl: embedUrl,
      },
      { returnDocument: 'after' }
    );

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    console.log("YouTube video added successfully:", lectureId);

    res.status(200).json({
      success: true,
      message: "YouTube video added to lecture successfully",
      data: lecture,
    });
  } catch (error) {
    console.error("Error adding YouTube video to lecture:", error);
    res.status(500).json({
      success: false,
      message: "Error adding YouTube video to lecture",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * @desc    Upload video file to lecture
 * @route   POST /api/lectures/:id/video
 * @access  Private/Admin
 */
export const uploadLectureVideo = async (req, res) => {
  try {
    const lectureId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a video file",
      });
    }

    // Verify lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    // Build the video URL based on uploaded file
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    // Update lecture with video URL
    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      {
        videoUrl: videoUrl
      },
      { returnDocument: 'after' }
    );

    console.log("Video uploaded to lecture:", { lectureId, videoUrl });

    res.status(200).json({
      success: true,
      message: "Video uploaded to lecture successfully",
      data: updatedLecture,
    });
  } catch (error) {
    console.error("Error uploading video to lecture:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading video to lecture",
      error: error.message || "Unknown error",
    });
  }
};