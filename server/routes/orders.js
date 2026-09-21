const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = 'ORD-' + Date.now().toString(36).toUpperCase();
    const tickets = [];
    if (d.items && d.items.length) {
      const R = () => crypto.randomBytes(4).readUInt32BE(0) / 0x100000000;
      const evRes = await pool.query('SELECT start FROM events WHERE id = $1', [d.eventId || d.ev]);
      const year = evRes.rows.length ? new Date(evRes.rows[0].start).getFullYear() : 2026;
      for (const [type, qty] of d.items) {
        for (let i = 0; i < qty; i++) {
          const code = 'NSUSC-' + year + '-' + String(Math.floor(R() * 900) + 100).padStart(6, '0');
          tickets.push({ id: code, type, used: false });
        }
      }
    }
    const { rows } = await pool.query(
      'INSERT INTO orders (id, event_id, name, email, phone, items, total, status, method, tickets) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [id, d.eventId || d.ev, d.name, d.email, d.phone || '', JSON.stringify(d.items || []), d.total || 0, 'pending', d.method || '', JSON.stringify(tickets)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error('Create order error:', err); res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id/status', authRequired, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'pending', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { rows } = await pool.query('UPDATE orders SET status = $2 WHERE id = $1 RETURNING *', [req.params.id, status]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
