const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

module.exports = router;
