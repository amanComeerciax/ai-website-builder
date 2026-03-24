/**
 * Context Collection Route V3.0
 * 
 * POST /api/context/questions  — Ask AI for clarifying questions about the user's prompt
 * POST /api/context/enrich     — Merge answers into an enriched prompt string
 */

const express = require('express');
const router = express.Router();
const { collectContext, buildEnrichedPrompt } = require('../services/contextAgent');

/**
 * POST /api/context/questions
 * Body: { prompt: string }
 * Returns: { questions: [...], skipAllowed: boolean }
 */
router.post('/questions', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const result = await collectContext(prompt);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/context/enrich
 * Body: { originalPrompt: string, answers: [{ question: string, answer: string }] }
 * Returns: { enrichedPrompt: string }
 */
router.post('/enrich', (req, res) => {
  const { originalPrompt, answers } = req.body;
  if (!originalPrompt) {
    return res.status(400).json({ error: 'originalPrompt is required' });
  }
  const enrichedPrompt = buildEnrichedPrompt(originalPrompt, answers || []);
  res.json({ enrichedPrompt });
});

module.exports = router;
