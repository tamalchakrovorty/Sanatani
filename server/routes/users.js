const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  try { const { rows } = await pool.query('SELECT id, name, email, role, active FROM users ORDER BY name'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    if (!d.name || !d.email || !d.password) return res.status(400).json({ error: 'Name, email and password required' });
    const hash = await bcrypt.hash(d.password, 10);
    const id = 'u' + Date.now().toString(36);
    const { rows } = await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role, active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, active',
      [id, d.name, d.email, hash, d.role || 'Editor', d.active !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    let q, params;
    if (d.password) {
      const hash = await bcrypt.hash(d.password, 10);
      q = 'UPDATE users SET name=$2, email=$3, role=$4, active=$5, password_hash=$6 WHERE id=$1 RETURNING id, name, email, role, active';
      params = [req.params.id, d.name, d.email, d.role || 'Editor', d.active !== false, hash];
    } else {
      q = 'UPDATE users SET name=$2, email=$3, role=$4, active=$5 WHERE id=$1 RETURNING id, name, email, role, active';
      params = [req.params.id, d.name, d.email, d.role || 'Editor', d.active !== false];
    }
    const { rows } = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
