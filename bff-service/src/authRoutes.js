const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { verifyToken } = require('./authMiddleware');
const SECRET = process.env.JWT_SECRET || 'dev_secret_for_tests_only';

// Simple login endpoint for demo/tests
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  // NOTE: in production replace with real user validation
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ sub: username, role: 'admin' }, SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/me', verifyToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
