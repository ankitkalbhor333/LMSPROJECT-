import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  title: String,
  subject: String,
  timeLimit: Number,
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
    }
  ],
}, { timestamps: true });

export default mongoose.model("FreeTest", testSchema);