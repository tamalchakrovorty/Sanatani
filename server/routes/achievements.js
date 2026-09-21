const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const stats = await pool.query('SELECT * FROM stats ORDER BY sort_order');
    const timeline = await pool.query('SELECT * FROM timeline ORDER BY sort_order');
    res.json({ stats: stats.rows, timeline: timeline.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/', authRequired, adminOnly, async (req, res) => {
  try {
    const { stats, timeline } = req.body;
    await pool.query('DELETE FROM stats');
    if (stats && stats.length) {
      for (let i = 0; i < stats.length; i++) {
        const s = stats[i];
        await pool.query('INSERT INTO stats (number, label, sort_order) VALUES ($1, $2, $3)', [s[0] || s.number, s[1] || s.label, i]);
      }
    }
    await pool.query('DELETE FROM timeline');
    if (timeline && timeline.length) {
      for (let i = 0; i < timeline.length; i++) {
        const t = timeline[i];
        await pool.query('INSERT INTO timeline (year, title, description, sort_order) VALUES ($1, $2, $3, $4)', [t[0] || t.year, t[1] || t.title, t[2] || t.description || '', i]);
      }
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
