const express = require('express');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

async function uniqueId(base, table) {
  let id = base, n = 2;
  while (true) {
    const { rows } = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
    if (!rows.length) return id;
    id = base + '-' + n++;
  }
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events ORDER BY start DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE pub = true ORDER BY start DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const id = await uniqueId(slugify(d.title || 'event'), 'events');
    const { rows } = await pool.query(`INSERT INTO events (id, title, cat, venue, start, "end", blurb, "desc", sched, tickets, partners, cover_image, motif, pal_key, pal, cd, pub, posts, notices) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`, [id, d.title, d.cat || 'Festival', d.venue, d.start, d.end, d.blurb || '', JSON.stringify(d.desc || []), JSON.stringify(d.sched || []), d.tickets ? JSON.stringify(d.tickets) : null, JSON.stringify(d.partners || []), d.coverImage || '', d.motif || 'mandala', d.palKey || 'maroon', JSON.stringify(d.pal || ['#8a1c30', '#3d0a14']), d.cd !== false, d.pub === true, JSON.stringify(d.posts || []), JSON.stringify(d.notices || [])]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const { rows } = await pool.query(`UPDATE events SET title=$2, cat=$3, venue=$4, start=$5, "end"=$6, blurb=$7, "desc"=$8, sched=$9, tickets=$10, partners=$11, cover_image=$12, motif=$13, pal_key=$14, pal=$15, cd=$16, pub=$17, posts=$18, notices=$19 WHERE id=$1 RETURNING *`, [req.params.id, d.title, d.cat, d.venue, d.start, d.end, d.blurb || '', JSON.stringify(d.desc || []), JSON.stringify(d.sched || []), d.tickets ? JSON.stringify(d.tickets) : null, JSON.stringify(d.partners || []), d.coverImage || d.cover_image || '', d.motif || 'mandala', d.palKey || d.pal_key || 'maroon', JSON.stringify(d.pal || ['#8a1c30', '#3d0a14']), d.cd !== false, d.pub === true, JSON.stringify(d.posts || []), JSON.stringify(d.notices || [])]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/pub', authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE events SET pub = NOT pub WHERE id = $1 RETURNING id, pub', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
