const express = require('express');
const multer = require('multer');
const path = require('path');
const { authRequired, adminOnly } = require('../auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only jpg, png, gif, webp and svg images are allowed'), ok);
  }
});

router.post('/', authRequired, adminOnly, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/' + req.file.filename;
    res.json({ url, filename: req.file.filename });
  });
});

module.exports = router;
