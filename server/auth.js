const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'change-me';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function editorOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Editor')) {
    return res.status(403).json({ error: 'Editor or Admin access required' });
  }
  next();
}

module.exports = { generateToken, authRequired, adminOnly, editorOrAdmin, SECRET };
