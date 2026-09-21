const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, authRequired, adminOnly } = require('../auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const hash = await bcrypt.hash(password, 10);
    const id = 'u' + Date.now().toString(36);
    await pool.query('INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)', [id, name, email, hash, role || 'Editor']);
    res.status(201).json({ id, name, email, role: role || 'Editor' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
