const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /progress/:sessionId
router.get("/progress/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId || "default_session";

  try {
    // Get total questions count
    const questionsResult = await pool.query("SELECT COUNT(*) FROM questions");
    const totalQuestions = parseInt(questionsResult.rows[0].count, 10);

    // Get saved answers and categories
    const answersResult = await pool.query(
      "SELECT category FROM user_answers WHERE session_id = $1",
      [sessionId]
    );
    const answers = answersResult.rows;
    const savedAnswers = answers.length;
    const categoriesCovered = [...new Set(answers.map((a) => a.category))];

    // Upsert progress record
    await pool.query(
      `INSERT INTO user_progress (session_id, total_questions, answered_questions, categories_practiced, last_activity)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (session_id) DO UPDATE SET
         total_questions = EXCLUDED.total_questions,
         answered_questions = EXCLUDED.answered_questions,
         categories_practiced = EXCLUDED.categories_practiced,
         last_activity = NOW()`,
      [sessionId, totalQuestions, savedAnswers, categoriesCovered]
    );

    res.json({
      totalQuestions,
      savedAnswers,
      categoriesCovered,
    });
  } catch (error) {
    console.error("Error fetching/updating progress:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
