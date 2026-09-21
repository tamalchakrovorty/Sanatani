const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM partnerships'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM partnerships WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const id = 'ps-' + Date.now().toString(36);
    const { rows } = await pool.query(
      'INSERT INTO partnerships (id, partner_id, event_id, text) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, d.partnerId || d.p, d.eventId || d.ev, d.text || d.t || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const { rows } = await pool.query(
      'UPDATE partnerships SET partner_id=$2, event_id=$3, text=$4 WHERE id=$1 RETURNING *',
      [req.params.id, d.partnerId || d.p, d.eventId || d.ev, d.text || d.t || '']
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM partnerships WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
