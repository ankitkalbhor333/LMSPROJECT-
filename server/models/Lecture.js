import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  videoUrl: String,
  duration: Number,
  order: Number,
  // YouTube video fields
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
  materials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material"
    }
  ]
}, { timestamps: true });

export default mongoose.model("Lecture", lectureSchema);