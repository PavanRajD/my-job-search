const express = require("express");
const router = express.Router();
const pool = require("../db");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

function mapToValidCategory(category) {
  const categoryMap = {
    'leadership': 'Leadership',
    'problem solving': 'Problem Solving',
    'communication': 'Communication',
    'teamwork': 'Teamwork',
    'adaptability': 'Adaptability',
    'technical': 'Problem Solving',
    'conflict resolution': 'Conflict Resolution',
    'time management': 'Time Management',
    'decision making': 'Decision Making',
    'stress management': 'Stress Management',
    'creativity and innovation': 'Creativity and Innovation'
  };
  return categoryMap[category.toLowerCase().trim()] || 'Problem Solving';
}

router.post("/generate-questions", async (req, res) => {
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key not configured" });
  }

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
                  text: `Generate mostly asked behavioral interview questions for a ${role} position. 

Format as JSON array with objects having:
{
  "category": "category_name",
  "text": "question text"
}

Categories: Leadership, Problem Solving, Communication, Teamwork, Adaptability, Creativity, Conflict Resolution, Time Management, Decision Making, Stress Management, Technical Skills.

Use STAR method phrasing like "Tell me about a time when..." for ${role} role.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    let questions = [];
    try {
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
      const parsedQuestions = JSON.parse(cleanJson);

      questions = parsedQuestions
        .map((q) => ({
          category: mapToValidCategory(q.category),
          text: q.text,
        }))
        .filter((q) => q && q.category && q.text && typeof q.text === "string");
    } catch (parseError) {
      console.error("Failed to parse JSON from AI response:", parseError);
      return res
        .status(500)
        .json({ error: "Failed to parse questions from AI response" });
    }

    return res.json({ questions });
  } catch (error) {
    console.error("Error generating questions with Google AI:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate questions", details: error.message });
  }
});

router.post("/insert-questions", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: "questions array is required" });
  }

  try {
    await pool.query("DELETE FROM questions WHERE id IS NOT NULL");
    const insertValues = questions.map((q) => [q.category, q.text]);
    const query = "INSERT INTO questions (category, text) VALUES ($1, $2)";
    for (const [category, text] of insertValues) {
      await pool.query(query, [category, text]);
    }
    return res.json({ success: true, count: questions.length });
  } catch (error) {
    console.error("Failed to insert questions into database:", error);
    return res
      .status(500)
      .json({ error: "Failed to insert questions", details: error.message });
  }
});

module.exports = router;
