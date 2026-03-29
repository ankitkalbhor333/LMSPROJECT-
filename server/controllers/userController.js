import User from "../models/User.js";
import Result from "../models/Result.js";

export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const getMyCourses = async (req, res) => {
  const user = await User.findById(req.user._id).populate("purchasedCourses");

  res.json(user.purchasedCourses);
};

export const updateProfile = async (req, res) => {
  try {
    const { name, studentProfile, teacherProfile } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic info
    if (name) {
      user.name = name;
    }

    // Update student profile if provided and user is student
    if (studentProfile && user.role === "student") {
      user.studentProfile = {
        ...user.studentProfile,
        ...studentProfile
      };
    }

    // Update teacher profile if provided and user is teacher
    if (teacherProfile && user.role === "teacher") {
      user.teacherProfile = {
        ...user.teacherProfile,
        ...teacherProfile
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      studentProfile: updatedUser.studentProfile,
      teacherProfile: updatedUser.teacherProfile
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      message: "Error updating profile",
      error: error.message
    });
  }
};

export const uploadProfileAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedPath = `/${req.file.path.replace(/\\/g, "/")}`;
    user.avatar = normalizedPath;
    await user.save();

    return res.json({
      message: "Profile photo updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("❌ Error uploading profile avatar:", error);
    return res.status(500).json({
      message: "Error uploading profile photo",
      error: error.message,
    });
  }
};

export const removeProfileAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.avatar = "";
    await user.save();

    return res.json({
      message: "Profile photo removed successfully",
      avatar: "",
    });
  } catch (error) {
    console.error("❌ Error removing profile avatar:", error);
    return res.status(500).json({
      message: "Error removing profile photo",
      error: error.message,
    });
  }
};

/**
 * Get all students (Admin only)
 * @route GET /api/user/all
 */
export const getAllStudents = async (req, res) => {
  try {
    console.log("👥 Fetching all students...");
    
    // Fetch all users with student role - include both email and phone
    const students = await User.find({ role: "student" })
      .select("_id name email phone role createdAt studentProfile")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${students.length} students`);

    res.json(students);
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({
      message: "Error fetching students",
      error: error.message
    });
  }
};
