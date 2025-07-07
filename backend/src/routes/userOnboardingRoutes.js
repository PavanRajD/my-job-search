const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get a specific value by key
router.get("/user-meta/generic/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const result = await pool.query(
      "SELECT value FROM user_meta WHERE key = $1 LIMIT 1",
      [key]
    );
    res.json({ value: result.rows[0]?.value || null });
  } catch (error) {
    console.error("Error fetching user meta:", error);
    res.status(500).json({ error: error.message });
  }
});

// Set or update a value
router.post("/user-meta", async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "key is required" });
  try {
    await pool.query(
      `INSERT INTO user_meta (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error setting user meta:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all experiences
router.get("/user-meta/experiences", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM user_meta WHERE key LIKE 'experience_%'"
    );
    const experiences = {};
    result.rows.forEach((item) => {
      if (item.value) experiences[item.key] = item.value;
    });
    res.json({ experiences });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new experience
router.post("/user-meta/experience", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content is required" });
  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM user_meta WHERE key LIKE 'experience_%'"
    );
    const count = parseInt(countResult.rows[0]?.count || "0");
    const newCount = count + 1;
    const experienceKey = `experience_${newCount}`;
    await pool.query(
      `INSERT INTO user_meta (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [experienceKey, content]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding experience:", error);
    res.status(500).json({ error: error.message });
  }
});

// Remove an experience
router.delete("/user-meta/experience/:key", async (req, res) => {
  const { key } = req.params;
  try {
    await pool.query("DELETE FROM user_meta WHERE key = $1", [key]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing experience:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get combined context (resume + all experiences)
router.get("/user-meta/combined-context", async (_req, res) => {
  try {
    const resumeResult = await pool.query(
      "SELECT value FROM user_meta WHERE key = 'resume_content'"
    );
    const resumeContent = resumeResult.rows[0]?.value || "";
    const expResult = await pool.query(
      "SELECT key, value FROM user_meta WHERE key LIKE 'experience_%'"
    );
    let combined = "";
    if (resumeContent) combined += `RESUME CONTENT:\n${resumeContent}\n\n`;
    if (expResult.rows.length > 0) {
      combined += "ADDITIONAL EXPERIENCES:\n\n";
      expResult.rows.forEach((item, idx) => {
        combined += `${idx + 1}. ${item.value}\n\n`;
      });
    }
    res.json({ combined });
  } catch (error) {
    console.error("Error getting combined context:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check if onboarding is completed
router.get("/user-meta/onboarding-completed", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM user_meta WHERE key = 'onboarding_completed'"
    );
    res.json({ completed: result.rows[0]?.value === "true" });
  } catch (error) {
    console.error("Error checking onboarding:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mark onboarding as completed
router.post("/user-meta/complete-onboarding", async (_req, res) => {
  try {
    await pool.query(
      `INSERT INTO user_meta (key, value, updated_at)
       VALUES ('onboarding_completed', 'true', NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all user data
router.delete("/user-meta/clear", async (_req, res) => {
  try {
    await pool.query("DELETE FROM user_meta WHERE key <> ''");
    // Reinitialize with default values
    await pool.query(
      `INSERT INTO user_meta (key, value, updated_at)
       VALUES 
         ('onboarding_completed', 'false', NOW()),
         ('resume_content', '', NOW()),
         ('resume_filename', '', NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing user data:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
