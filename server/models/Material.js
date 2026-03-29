import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileUrl: String,
    type: String,
    fileSize: String,
    downloads: {
      type: Number,
      default: 0,
    },
    // Vimeo video fields (legacy support)
    vimeoId: {
      type: String,
      default: null,
    },
    vimeoLink: {
      type: String,
      default: null,
    },
    videoSource: {
      type: String,
      enum: ['local', 'vimeo'],
      default: 'local',
    },
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);