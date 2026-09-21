const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }

router.get('/', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM partners ORDER BY name'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/public', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM partners ORDER BY name'); res.json(rows); } catch (err) { res.status(500).json({ error: 'Server error' }); } });
router.get('/:id', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM partners WHERE id = $1', [req.params.id]); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

router.post('/', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; let id = slugify(d.name || 'partner'); const { rows: ex } = await pool.query('SELECT id FROM partners WHERE id = $1', [id]); if (ex.length) id = id + '-' + Date.now().toString(36).slice(-4); const { rows } = await pool.query('INSERT INTO partners (id, name, kind, mono, color) VALUES ($1,$2,$3,$4,$5) RETURNING *', [id, d.name, d.kind || '', (d.mono || '').slice(0, 3), d.color || '#8A1C30']); res.status(201).json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try { const d = req.body; const { rows } = await pool.query('UPDATE partners SET name=$2, kind=$3, mono=$4, color=$5 WHERE id=$1 RETURNING *', [req.params.id, d.name, d.kind || '', (d.mono || '').slice(0, 3), d.color || '#8A1C30']); if (!rows.length) return res.status(404).json({ error: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => { try { const { rowCount } = await pool.query('DELETE FROM partners WHERE id = $1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: 'Server error' }); } });

module.exports = router;
