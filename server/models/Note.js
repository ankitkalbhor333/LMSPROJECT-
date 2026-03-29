import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: String,
  subject: String,
  chapter: String,
  fileUrl: String,
  fileSize: String,
  downloads: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);