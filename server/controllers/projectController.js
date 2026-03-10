const Project = require("../models/Project");

exports.createProject = async (req, res) => {
  try {

    const userId = req.auth.userId;

    const {
      businessName,
      businessType,
      description,
      services,
      themeColor
    } = req.body;

    const project = new Project({
      userId,
      businessName,
      businessType,
      description,
      services,
      themeColor
    });

    await project.save();

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