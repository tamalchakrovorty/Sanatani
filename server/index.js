const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = require('./db');
const migrate = require('./migrate');
const { authRequired, adminOnly } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/partnerships', require('./routes/partnerships'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/public/all', async (req, res) => {
  try {
    const [events, posts, notices, albums, partners, partnerships, settings, stats, timeline] = await Promise.all([
      pool.query('SELECT * FROM events WHERE pub = true ORDER BY start DESC'),
      pool.query('SELECT * FROM posts WHERE pub = true ORDER BY date DESC'),
      pool.query('SELECT * FROM notices WHERE pub = true ORDER BY date DESC'),
      pool.query('SELECT * FROM albums WHERE pub = true'),
      pool.query('SELECT * FROM partners ORDER BY name'),
      pool.query('SELECT * FROM partnerships'),
      pool.query('SELECT * FROM settings'),
      pool.query('SELECT * FROM stats ORDER BY sort_order'),
      pool.query('SELECT * FROM timeline ORDER BY sort_order'),
    ]);
    const s = {};
    settings.rows.forEach(r => { s[r.key] = r.value; });
    res.json({
      events: events.rows,
      posts: posts.rows,
      notices: notices.rows,
      albums: albums.rows,
      partners: partners.rows,
      partnerships: partnerships.rows,
      settings: s,
      stats: stats.rows,
      timeline: timeline.rows,
    });
  } catch (err) {
    console.error('Public API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/all', authRequired, adminOnly, async (req, res) => {
  try {
    const [events, posts, notices, albums, partners, partnerships, orders, donations, messages, users, settings, stats, timeline] = await Promise.all([
      pool.query('SELECT * FROM events ORDER BY start DESC'),
      pool.query('SELECT * FROM posts ORDER BY date DESC'),
      pool.query('SELECT * FROM notices ORDER BY date DESC'),
      pool.query('SELECT * FROM albums'),
      pool.query('SELECT * FROM partners ORDER BY name'),
      pool.query('SELECT * FROM partnerships'),
      pool.query('SELECT * FROM orders ORDER BY created_at DESC'),
      pool.query('SELECT * FROM donations ORDER BY created_at DESC'),
      pool.query('SELECT * FROM messages ORDER BY created_at DESC'),
      pool.query('SELECT id, name, email, role, active FROM users ORDER BY name'),
      pool.query('SELECT * FROM settings'),
      pool.query('SELECT * FROM stats ORDER BY sort_order'),
      pool.query('SELECT * FROM timeline ORDER BY sort_order'),
    ]);
    const s = {};
    settings.rows.forEach(r => { s[r.key] = r.value; });
    res.json({
      events: events.rows,
      posts: posts.rows,
      notices: notices.rows,
      albums: albums.rows,
      partners: partners.rows,
      partnerships: partnerships.rows,
      orders: orders.rows,
      donations: donations.rows,
      messages: messages.rows,
      users: users.rows,
      settings: s,
      stats: stats.rows,
      timeline: timeline.rows,
    });
  } catch (err) {
    console.error('Admin API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
    await migrate();
    console.log('Migrations complete');
    app.listen(PORT, () => {
      console.log('Sanatani API running on port ' + PORT);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
