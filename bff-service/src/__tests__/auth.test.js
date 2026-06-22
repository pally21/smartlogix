const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

const SECRET = process.env.JWT_SECRET || 'dev_secret_for_tests_only';

describe('Auth middleware and routes', () => {
  test('POST /api/auth/login returns token for valid creds', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login rejects missing creds', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login rejects bad creds', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'x', password: 'y' });
    expect(res.status).toBe(401);
  });

  test('verifyToken allows valid token to access protected route', async () => {
    const token = jwt.sign({ sub: 'testuser' }, SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/inventory/').set('Authorization', `Bearer ${token}`);
    // inventory route proxied in real runtime; in tests it will 502 or similar if unreachable
    // We only assert that middleware does not return 401
    expect(res.status).not.toBe(401);
  });

  test('verifyToken rejects invalid token', async () => {
    const res = await request(app).get('/api/inventory/').set('Authorization', `Bearer invalid.token.here`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_INVALID');
  });

  test('verifyToken rejects expired token', async () => {
    const token = jwt.sign({ sub: 'testuser' }, SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/inventory/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  test('GET /api/auth/me returns user when token present', async () => {
    const token = jwt.sign({ sub: 'me' }, SECRET, { expiresIn: '1h' });
    // /api/auth/me requires token; call route with token
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    // App's authRoutes returns 401 if req.user missing; ensure not 401
    expect(res.status).not.toBe(401);
  });
});
