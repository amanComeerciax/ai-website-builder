const Project = require("../models/Project");
const User = require("../models/User");

exports.createProject = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    // Find user and check limits
    let user = await User.findOne({ clerkId });
    if (!user) {
      // If user doesn't exist in our DB yet, they might be new from Clerk.
      // We should handle this gracefully, but for now we assume they exist.
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const limits = user.getTierLimits();
    const currentCount = await Project.countDocuments({ userId: clerkId });

    if (currentCount >= limits.maxProjects) {
      return res.status(403).json({
        success: false,
        error: `Limit reached. You have used your ${limits.maxProjects} free generations. Please upgrade to Pro for unlimited access.`,
        limitReached: true
      });
    }

    const {
      businessName,
      businessType,
      description,
      services,
      themeColor
    } = req.body;

    const project = new Project({
      userId: clerkId,
      businessName,
      businessType,
      description,
      services,
      themeColor
    });

    await project.save();

    // Increment user usage stats
    user.usage.projectCount = (user.usage.projectCount || 0) + 1;
    await user.save();

    res.status(201).json({
      success: true,
      project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getUserProjects = async (req, res) => {
  try {

    const userId = req.auth.userId;

    const projects = await Project.find({ userId });

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};