const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret_for_tests_only';

function verifyToken(req, res, next) {
  // 1) If gateway injected decoded payload, trust it
  const injected = req.headers['x-auth-payload'];
  if (injected) {
    try {
      req.user = JSON.parse(injected);
      return next();
    } catch (e) {
      // If injected header is malformed, reject early
      return res.status(401).json({ error: 'Invalid injected auth payload' });
    }
  }

  // 2) Fallback: verify Authorization Bearer token (useful for tests and direct calls)
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'TOKEN_INVALID' });
  }
}

module.exports = { verifyToken };
