import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number // index of correct option
});

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Test", testSchema);