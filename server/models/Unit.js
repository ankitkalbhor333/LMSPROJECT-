import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  title: {
    type: String,
    required: true
  },
    lectures:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      }
    
    ],
  order: Number
}, { timestamps: true });

export default mongoose.model("Unit", unitSchema);