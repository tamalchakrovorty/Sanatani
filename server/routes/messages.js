const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM messages ORDER BY created_at DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = 'MSG-' + Date.now().toString(36).toUpperCase();
    const { rows } = await pool.query(
      'INSERT INTO messages (id, name, email, subject, body) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, d.name, d.email, d.subject || '', d.body || d.message || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id/read', authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE messages SET read = NOT read WHERE id = $1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
