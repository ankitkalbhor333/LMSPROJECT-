import mongoose from "mongoose";
import Material from "./models/Material.js";
import Lecture from "./models/Lecture.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration Script: Link existing materials to lectures
 * This script adds materialIds to lecture's materials array for all existing materials
 */

const migrateMaterials = async () => {
  try {
    console.log("🔄 Starting material migration...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all materials
    const materials = await Material.find({});
    console.log(`📄 Found ${materials.length} materials to migrate`);

    let updated = 0;
    let skipped = 0;

    // For each material, add it to the lecture's materials array
    for (const material of materials) {
      try {
        // Check if material is already in lecture's materials array
        const lecture = await Lecture.findById(material.lectureId);

        if (!lecture) {
          console.warn(`⚠️  Lecture not found for material: ${material._id}`);
          skipped++;
          continue;
        }

        // Check if material is already in the array
        if (lecture.materials.includes(material._id)) {
          console.log(`⏭️  Material already linked: ${material.title}`);
          skipped++;
          continue;
        }

        // Add material ID to lecture's materials array
        await Lecture.findByIdAndUpdate(
          material.lectureId,
          { $push: { materials: material._id } }
        );

        console.log(`✅ Migrated: ${material.title}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error migrating material ${material._id}:`, error);
        skipped++;
      }
    }

    console.log(`\n📊 Migration Complete!`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📄 Total: ${materials.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
migrateMaterials();
