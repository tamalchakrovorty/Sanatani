const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM donations ORDER BY created_at DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = 'DON-' + Date.now().toString(36).toUpperCase();
    const { rows } = await pool.query(
      'INSERT INTO donations (id, name, email, amount, method) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, d.name, d.email, d.amount || 0, d.method || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
