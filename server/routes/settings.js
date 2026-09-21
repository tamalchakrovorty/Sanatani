const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM settings');
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    for (const [key, value] of Object.entries(d)) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, JSON.stringify(value)]
      );
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
