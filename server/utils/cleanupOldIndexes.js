import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import CourseProgress from "../models/CourseProgress.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Cleanup script to remove old indexes from database
 * Run this once after deploying schema changes
 */

const cleanupIndexes = async () => {
  try {
    console.log("🧹 Starting index cleanup...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clean Enrollment collection
    console.log("\n📋 Cleaning Enrollment collection...");
    const enrollmentCollection = Enrollment.collection;
    const enrollmentIndexes = await enrollmentCollection.getIndexes();
    
    for (const [indexName, indexSpec] of Object.entries(enrollmentIndexes)) {
      if (indexName.includes("studentId") || indexName === "_id_") continue; // Skip _id index
      
      // Check if it's a duplicate index
      if (indexName !== "studentId_1_courseId_1" && !indexName.startsWith("userId")) {
        console.log(`  ⚠️ Index ${indexName} might be old, keeping for now...`);
      }
    }
    
    // Specifically drop studentId index if exists
    try {
      await enrollmentCollection.dropIndex("studentId_1_courseId_1");
      console.log("  ✅ Dropped old studentId_1_courseId_1 index");
    } catch (err) {
      if (err.message.includes("index not found")) {
        console.log("  ℹ️ studentId index doesn't exist (already cleaned)");
      } else {
        console.warn("  ⚠️ Error dropping studentId index:", err.message);
      }
    }

    // Clean Payment collection
    console.log("\n💳 Cleaning Payment collection...");
    const paymentCollection = Payment.collection;
    const paymentIndexes = await paymentCollection.getIndexes();
    
    for (const [indexName] of Object.entries(paymentIndexes)) {
      if (indexName === "_id_") continue;
      console.log(`  Found index: ${indexName}`);
    }

    // Clean CourseProgress collection
    console.log("\n📊 Cleaning CourseProgress collection...");
    const progressCollection = CourseProgress.collection;
    const progressIndexes = await progressCollection.getIndexes();
    
    for (const [indexName] of Object.entries(progressIndexes)) {
      if (indexName === "_id_") continue;
      console.log(`  Found index: ${indexName}`);
    }

    console.log("\n✅ Index cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    process.exit(1);
  }
};

cleanupIndexes();
