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

const Q = {
  eventsPub: `SELECT id, title, cat, venue, start, "end", blurb, "desc", sched, tickets, partners,
    cover_image as "coverImage", cover_mode as "coverMode", cover_frame as "coverFrame", motif, pal_key as "palKey", pal, cd, pub, posts, notices
    FROM events WHERE pub = true ORDER BY start DESC`,
  eventsAll: `SELECT id, title, cat, venue, start, "end", blurb, "desc", sched, tickets, partners,
    cover_image as "coverImage", cover_mode as "coverMode", cover_frame as "coverFrame", motif, pal_key as "palKey", pal, cd, pub, posts, notices
    FROM events ORDER BY start DESC`,
  postsPub: `SELECT id, title, kind, cat, sec, date, summary as x, body, ev_id as ev,
    cover_image as "coverImage", motif, pal_key as "palKey", pal, pub
    FROM posts WHERE pub = true ORDER BY date DESC`,
  postsAll: `SELECT id, title, kind, cat, sec, date, summary as x, body, ev_id as ev,
    cover_image as "coverImage", motif, pal_key as "palKey", pal, pub
    FROM posts ORDER BY date DESC`,
  noticesPub: `SELECT id, title, cat, date, short, body, ev_id as ev, pub
    FROM notices WHERE pub = true ORDER BY date DESC`,
  noticesAll: `SELECT id, title, cat, date, short, body, ev_id as ev, pub
    FROM notices ORDER BY date DESC`,
  albumsPub: `SELECT id, ev_id as ev, n, vid, pub FROM albums WHERE pub = true`,
  albumsAll: `SELECT id, ev_id as ev, n, vid, pub FROM albums`,
  partnerships: `SELECT id, partner_id as p, event_id as ev, text as t FROM partnerships`,
  orders: `SELECT id, event_id as ev, name, email, phone, items, total, status, method, tickets, created_at as at
    FROM orders ORDER BY created_at DESC`,
  donations: `SELECT id, name, email, amount as amt, method, created_at as at
    FROM donations ORDER BY created_at DESC`,
  messages: `SELECT id, name, email, subject, body, read, created_at as at
    FROM messages ORDER BY created_at DESC`,
};

app.get('/api/public/all', async (req, res) => {
  try {
    const [events, posts, notices, albums, partners, partnerships, settings, stats, timeline] = await Promise.all([
      pool.query(Q.eventsPub),
      pool.query(Q.postsPub),
      pool.query(Q.noticesPub),
      pool.query(Q.albumsPub),
      pool.query('SELECT id, name, kind, mono, color as c FROM partners ORDER BY name'),
      pool.query(Q.partnerships),
      pool.query('SELECT * FROM settings'),
      pool.query('SELECT ARRAY[number, label] as row FROM stats ORDER BY sort_order'),
      pool.query('SELECT ARRAY[year, title, description] as row FROM timeline ORDER BY sort_order'),
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
      stats: stats.rows.map(r => r.row),
      timeline: timeline.rows.map(r => r.row),
    });
  } catch (err) {
    console.error('Public API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/all', authRequired, adminOnly, async (req, res) => {
  try {
    const [events, posts, notices, albums, partners, partnerships, orders, donations, messages, users, settings, stats, timeline] = await Promise.all([
      pool.query(Q.eventsAll),
      pool.query(Q.postsAll),
      pool.query(Q.noticesAll),
      pool.query(Q.albumsAll),
      pool.query('SELECT id, name, kind, mono, color as c FROM partners ORDER BY name'),
      pool.query(Q.partnerships),
      pool.query(Q.orders),
      pool.query(Q.donations),
      pool.query(Q.messages),
      pool.query('SELECT id, name, email, role, active FROM users ORDER BY name'),
      pool.query('SELECT * FROM settings'),
      pool.query('SELECT ARRAY[number, label] as row FROM stats ORDER BY sort_order'),
      pool.query('SELECT ARRAY[year, title, description] as row FROM timeline ORDER BY sort_order'),
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
      stats: stats.rows.map(r => r.row),
      timeline: timeline.rows.map(r => r.row),
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
