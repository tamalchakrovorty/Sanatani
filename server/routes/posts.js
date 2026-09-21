const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

async function uniqueId(base) {
  let id = base, n = 2;
  while (true) {
    const { rows } = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (!rows.length) return id;
    id = base + '-' + n++;
  }
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/public', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE pub = true ORDER BY date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const id = await uniqueId(slugify(d.title || 'post'));
    const { rows } = await pool.query(`INSERT INTO posts (id, title, kind, cat, sec, date, summary, body, ev_id, cover_image, motif, pal_key, pal, pub) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [id, d.title, d.kind || 'post', d.cat || 'Community News', d.sec || null, d.date, d.summary || d.x || '', JSON.stringify(d.body || d.b || []), d.evId || d.ev || null, d.coverImage || '', d.motif || 'lotus', d.palKey || 'yellow', JSON.stringify(d.pal || ['#fff1a8', '#f0b94a']), d.pub === true]);
    res.status(201).json(rows[0]);
  } catch (err) { console.error('Create post error:', err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const { rows } = await pool.query(`UPDATE posts SET title=$2, kind=$3, cat=$4, sec=$5, date=$6, summary=$7, body=$8, ev_id=$9, cover_image=$10, motif=$11, pal_key=$12, pal=$13, pub=$14 WHERE id=$1 RETURNING *`, [req.params.id, d.title, d.kind || 'post', d.cat || 'Community News', d.sec || null, d.date, d.summary || d.x || '', JSON.stringify(d.body || d.b || []), d.evId || d.ev || null, d.coverImage || d.cover_image || '', d.motif || 'lotus', d.palKey || d.pal_key || 'yellow', JSON.stringify(d.pal || ['#fff1a8', '#f0b94a']), d.pub === true]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Update post error:', err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id/pub', authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE posts SET pub = NOT pub WHERE id = $1 RETURNING id, pub', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
