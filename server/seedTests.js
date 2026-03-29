const mongoose = require("mongoose");
require("dotenv").config();
const Test = require("./models/Test");
const Course = require("./models/Course");

async function seedTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Create or find a course
    let course = await Course.findOne({ title: "Mathematics" });
    if (!course) {
      course = await Course.create({
        title: "Mathematics",
        description: "Basic Mathematics Course",
        price: 499,
        instructor: "Admin",
        category: "Science",
      });
      console.log("Course created:", course._id);
    }

    // Create sample tests
    const sampleTests = [
      {
        title: "Math Quiz 1",
        course: course._id,
        duration: 30,
        questions: [
          {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1,
          },
          {
            question: "What is 5 * 3?",
            options: ["10", "12", "15", "20"],
            correctAnswer: 2,
          },
          {
            question: "What is 10 / 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 2,
          },
        ],
      },
      {
        title: "Math Quiz 2",
        course: course._id,
        duration: 30,
        questions: [
          {
            question: "What is 7 + 8?",
            options: ["14", "15", "16", "17"],
            correctAnswer: 1,
          },
          {
            question: "What is 9 * 2?",
            options: ["16", "17", "18", "19"],
            correctAnswer: 2,
          },
          {
            question: "What is 20 / 4?",
            options: ["4", "5", "6", "7"],
            correctAnswer: 1,
          },
        ],
      },
    ];

    // Delete existing tests
    await Test.deleteMany({});
    console.log("Old tests deleted");

    // Insert new tests
    const createdTests = await Test.insertMany(sampleTests);
    console.log("Tests created:", createdTests.length);

    createdTests.forEach((test) => {
      console.log(`✅ ${test.title} (${test._id})`);
    });

    console.log("\n✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tests:", error);
    process.exit(1);
  }
}

seedTests();
