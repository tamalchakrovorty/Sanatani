const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }
async function uniqueId(base) { let id = base, n = 2; while (true) { const { rows } = await pool.query('SELECT id FROM notices WHERE id = $1', [id]); if (!rows.length) return id; id = base + '-' + n++; } }

router.get('/', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM notices ORDER BY date DESC'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/public', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM notices WHERE pub = true ORDER BY date DESC'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/:id', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM notices WHERE id = $1', [req.params.id]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

router.post('/', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; const id = await uniqueId(slugify(d.title || 'notice')); const { rows } = await pool.query('INSERT INTO notices (id, title, cat, date, short, body, ev_id, pub) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [id, d.title, d.cat || 'Announcement', d.date, d.short || '', JSON.stringify(d.body || d.b || []), d.evId || d.ev || null, d.pub === true]); res.status(201).json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; const { rows } = await pool.query('UPDATE notices SET title=$2, cat=$3, date=$4, short=$5, body=$6, ev_id=$7, pub=$8 WHERE id=$1 RETURNING *', [req.params.id, d.title, d.cat, d.date, d.short || '', JSON.stringify(d.body || d.b || []), d.evId || d.ev || null, d.pub === true]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => { try { const { rowCount } = await pool.query('DELETE FROM notices WHERE id = $1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.patch('/:id/pub', authRequired, adminOnly, async (req, res) => { try { const { rows } = await pool.query('UPDATE notices SET pub = NOT pub WHERE id = $1 RETURNING id, pub', [req.params.id]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

module.exports = router;
