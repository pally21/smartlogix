const express = require('express');
const request = require('supertest');

// Mockamos el modelo Shipment
const mockShipment = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation(async (p) => ({ id: '123', ...p })),
  update: jest.fn().mockResolvedValue([1, [{ id: '123', status: 'DELIVERED' }]]),
};

jest.mock('../models', () => ({ Shipment: mockShipment }));

const shippingRouter = require('../routes/shipping');

describe('Shipping routes (unit)', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/shipping', shippingRouter);
  });

  test('GET /shipping returns 200 and array', async () => {
    mockShipment.findAll.mockResolvedValueOnce([]);
    const res = await request(app).get('/shipping');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /shipping/:id returns 404 when not found', async () => {
    mockShipment.findByPk.mockResolvedValueOnce(null);
    const res = await request(app).get('/shipping/doesnotexist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /shipping returns 400 when orderId missing', async () => {
    const res = await request(app).post('/shipping').send({});
    expect(res.status).toBe(400);
  });

  test('POST /shipping returns 201 when orderId provided', async () => {
    const payload = { orderId: 'ord-1', destinationAddress: 'Calle 1' };
    const res = await request(app).post('/shipping').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('orderId', 'ord-1');
  });

  test('PUT /shipping/:id/status returns 400 for invalid status', async () => {
    const res = await request(app).put('/shipping/123/status').send({ status: 'NOSENSE' });
    expect(res.status).toBe(400);
  });
});
