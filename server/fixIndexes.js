import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixIndexes = async () => {
  try {
    console.log("🔧 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Drop the problematic email index
    console.log("🔨 Dropping email_1 index...");
    try {
      await db.collection("users").dropIndex("email_1");
      console.log("✅ Dropped email_1 index");
    } catch (err) {
      if (err.message.includes("index not found")) {
        console.log("ℹ️  email_1 index doesn't exist (already dropped)");
      } else {
        throw err;
      }
    }

    // Recreate indexes from schema
    console.log("🔄 Recreating indexes from schema...");
    const User = mongoose.model("User", new mongoose.Schema({
      email: { type: String, unique: true, sparse: true },
      phone: { type: String, unique: true, required: true }
    }));

    await User.collection.dropIndex("email_1").catch(() => {});
    await User.syncIndexes();
    console.log("✅ Indexes synced successfully");

    await mongoose.connection.close();
    console.log("✅ Done! Database is fixed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fixIndexes();
