import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "https://lmsproject1-cuzs.onrender.com";

async function updateThumbnailUrls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all courses with thumbnail
    const courses = await Course.find({ thumbnail: { $exists: true, $ne: "" } });
    console.log(`📊 Found ${courses.length} courses with thumbnails`);

    let updated = 0;

    for (const course of courses) {
      const oldThumbnail = course.thumbnail;

      // Check if already a full URL
      if (oldThumbnail.startsWith("http://") || oldThumbnail.startsWith("https://")) {
        console.log(`⏭️  Skipping ${course.title} - already a full URL`);
        continue;
      }

      // Convert to full URL
      const newThumbnail = `${BACKEND_URL}/${oldThumbnail}`;

      await Course.findByIdAndUpdate(course._id, { thumbnail: newThumbnail });
      console.log(`✅ Updated: ${course.title}`);
      console.log(`   Old: ${oldThumbnail}`);
      console.log(`   New: ${newThumbnail}`);
      updated++;
    }

    console.log(`\n🎉 Updated ${updated} courses`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updateThumbnailUrls();
