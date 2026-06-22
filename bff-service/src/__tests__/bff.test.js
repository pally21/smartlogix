const express = require('express');
const request = require('supertest');

jest.mock('../httpClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
}));

const http = require('../httpClient');
const inventoryBff = require('../routes/inventoryBff');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', inventoryBff);
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || err }));
  return app;
}

describe('BFF inventory routes (unit)', () => {
  test('GET /products forwards response body', async () => {
    http.get.mockResolvedValue({ data: { success: true, data: [{ id: 1 }] } });
    const app = createApp();
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /products returns 201 when created', async () => {
    http.post.mockResolvedValue({ data: { success: true, data: { id: 10 } } });
    const app = createApp();
    const res = await request(app).post('/products').send({ name: 'X' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(10);
  });
});
