const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

/**
 * @route   GET /api/templates
 * @desc    Get all templates (lightweight - without full file payloads)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({}, '-files')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

/**
 * @route   GET /api/templates/:id
 * @desc    Get single template FULL payload including start files
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template payload:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template payload' });
  }
});

module.exports = router;
