const express = require("express");
const router = express.Router();
const pool = require("../db");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

// Fetch questions
router.get("/questions", async (req, res) => {
  const { category, limit } = req.query;
  try {
    let query = "SELECT * FROM questions";
    const params = [];
    if (category && category !== "All Categories") {
      params.push(category);
      query += ` WHERE category = $${params.length}`;
    }
    query += " ORDER BY created_at ASC";
    if (limit) {
      params.push(Number(limit));
      query += ` LIMIT $${params.length}`;
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate suggested answer
router.post("/questions/:id/suggested-answer", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM questions WHERE id = $1", [
      id,
    ]);
    const question = result.rows[0];
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: "Google API key not configured" });
    }

    // Use Google API for suggestion
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a STAR method answer for this interview question:\n"${question.text}"\n\nFormat:\nSITUATION: ...\nTASK: ...\nACTION: ...\nRESULT: ...`,
                  },
                ],
              },
            ],
          }),
        }
      );
      if (!response.ok) throw new Error("Google API error");
      const data = await response.json();
      const suggestedAnswer =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (suggestedAnswer) {
        return res.json({ suggestedAnswer });
      }
    } catch (err) {
      console.error("Google API error:", err);
    }
  } catch (error) {
    console.error("Error generating suggested answer:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
