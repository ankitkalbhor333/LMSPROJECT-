import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: String,
  className: String,
  exam: String,
  subject: String,
  duration: String,
  teacher: String,
  videoUrl: String,
  // YouTube fields for unlisted/free material videos
  youtubeId: {
    type: String,
    default: null,
  },
  youtubeLink: {
    type: String,
    default: null,
  },
  youtubeEmbedUrl: {
    type: String,
    default: null,
  },
  videoSource: {
    type: String,
    enum: ['local', 'youtube'],
    default: 'local',
  },
}, { timestamps: true });

export default mongoose.model("Videos", videoSchema);