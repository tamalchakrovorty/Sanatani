const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM albums'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/public', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM albums WHERE pub = true'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/:id', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM albums WHERE id = $1', [req.params.id]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

router.post('/', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; const id = d.evId || d.ev || 'album-' + Date.now().toString(36); const { rows } = await pool.query('INSERT INTO albums (id, ev_id, n, vid, pub) VALUES ($1,$2,$3,$4,$5) RETURNING *', [id, d.evId || d.ev, d.n || 8, JSON.stringify(d.vid || []), d.pub !== false]); res.status(201).json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; const { rows } = await pool.query('UPDATE albums SET ev_id=$2, n=$3, vid=$4, pub=$5 WHERE id=$1 RETURNING *', [req.params.id, d.evId || d.ev, d.n || 8, JSON.stringify(d.vid || []), d.pub !== false]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => { try { const { rowCount } = await pool.query('DELETE FROM albums WHERE id = $1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.patch('/:id/pub', authRequired, adminOnly, async (req, res) => { try { const { rows } = await pool.query('UPDATE albums SET pub = NOT pub WHERE id = $1 RETURNING id, pub', [req.params.id]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

module.exports = router;
