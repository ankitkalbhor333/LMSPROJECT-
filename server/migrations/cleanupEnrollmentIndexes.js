import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration to clean up old enrollment indexes
 * Runs on server startup to ensure database is clean
 */
export const cleanupEnrollmentIndexes = async () => {
  try {
    console.log("\n🔧 Checking Enrollment collection indexes...");
    
    const collection = mongoose.connection.collection("enrollments");
    if (!collection) {
      console.log("⏳ Waiting for connection to be ready...");
      return;
    }

    const existingIndexes = await collection.getIndexes();
    console.log("📋 Existing indexes:", Object.keys(existingIndexes));

    let droppedCount = 0;

    // Aggressively drop old studentId indexes
    for (const [indexName, indexSpec] of Object.entries(existingIndexes)) {
      if (indexName === "_id_") continue; // Skip default index

      // Drop any index with studentId
      if (indexName.includes("studentId") || (indexSpec.key && JSON.stringify(indexSpec.key).includes("studentId"))) {
        try {
          console.log(`🗑️  Dropping old index: ${indexName}`);
          await collection.dropIndex(indexName);
          droppedCount++;
          console.log(`   ✅ Dropped successfully`);
        } catch (err) {
          if (err.message.includes("index not found")) {
            console.log(`   ℹ️  Index doesn't exist anymore`);
          } else {
            console.warn(`   ⚠️  Could not drop ${indexName}:`, err.message);
          }
        }
      }
    }

    // List remaining indexes
    const updatedIndexes = await collection.getIndexes();
    console.log("\n📋 Remaining indexes:", Object.keys(updatedIndexes));

    // Ensure correct indexes exist with explicit drops first
    console.log("\n✅ Ensuring correct indexes...");
    
    // First, drop the old incorrect index if it somehow still exists under different name
    try {
      await collection.dropIndex("studentId_1_courseId_1");
      console.log("✅ Dropped studentId_1_courseId_1 if it existed");
    } catch (err) {
      // Ignore - likely doesn't exist
    }

    // Create new correct index
    try {
      await collection.dropIndex("userId_1_courseId_1");
      console.log("   Dropped existing userId index to recreate fresh");
    } catch (err) {
      // Ok if doesn't exist
    }

    try {
      await collection.createIndex(
        { userId: 1, courseId: 1 },
        { unique: true, sparse: false, name: "userId_1_courseId_1" }
      );
      console.log("✅ Created unique index on (userId, courseId)");
    } catch (err) {
      console.log("⚠️  Could not create index:", err.message);
    }

    console.log(`\n✅ Cleanup complete! Dropped ${droppedCount} old indexes\n`);
    return droppedCount;
  } catch (error) {
    console.error("❌ Index cleanup error:", error.message);
    console.error("   This is non-critical and won't stop the server");
    return 0;
  }
};

export default cleanupEnrollmentIndexes;
