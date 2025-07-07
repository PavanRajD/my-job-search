const express = require("express");
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

router.post("/infer-role", async (req, res) => {
  const { resumeContent } = req.body;

  if (!resumeContent || typeof resumeContent !== "string") {
    return res.status(400).json({ error: "resumeContent is required" });
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
                  text: `Analyze this resume and determine the most appropriate professional role. Choose EXACTLY ONE from this list:
- Frontend Developer
- Backend Developer
- Full Stack Developer
- Data Scientist
- Data Analyst
- DevOps Engineer
- Mobile Developer
- QA Engineer
- Product Manager
- UI/UX Designer
- Software Engineer
- General

Resume content:
${resumeContent}

Respond with ONLY the role name, nothing else.`,
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
    const inferredRole =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Ensure inferredRole is one of the valid roles (type-safe)
    const typedRole = inferredRole;
    return res.json({ inferredRole: typedRole });
  } catch (error) {
    console.error("Error calling Google AI API:", error);
    return res
      .status(500)
      .json({ error: "Failed to infer role", details: error.message });
  }
});

router.post("/confidence-level", async (req, res) => {
  const { resumeContent, inferredRole } = req.body;
  if (!resumeContent || typeof resumeContent !== "string" || !inferredRole) {
    return res
      .status(400)
      .json({ error: "resumeContent and inferredRole are required" });
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
                  text: `Rate the confidence level (0-100) that this resume matches the role "${inferredRole}". 

Resume content:
${resumeContent}

Respond with ONLY a number between 0 and 100, nothing else.`,
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
    const confidenceText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const confidence = parseInt(confidenceText);

    if (isNaN(confidence) || confidence < 0 || confidence > 100) {
      return res.status(422).json({
        error: "Invalid confidence returned from Google AI",
        raw: confidenceText,
      });
    }

    return res.json({ confidence: confidence / 100 });
  } catch (error) {
    console.error("Error calling Google AI API:", error);
    return res
      .status(500)
      .json({ error: "Failed to get confidence", details: error.message });
  }
});

module.exports = router;
