const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const BFF_URL = process.env.BFF_URL || 'http://localhost:4000';

describe('E2E Orders via BFF', () => {
  jest.setTimeout(20000);

  test('create order and verify persistence', async () => {
    // Get products
    const productsRes = await request(BFF_URL).get('/api/inventory/products');
    expect(productsRes.status).toBe(200);
    const products = productsRes.body?.data || [];
    expect(products.length).toBeGreaterThan(0);
    const product = products[0];

    const notes = `e2e-jest-${Date.now()}`;
    const customerId = uuidv4();

    const payload = {
      customerId,
      customerName: 'E2E Jest',
      customerEmail: 'e2e-jest@example.com',
      shippingAddress: 'Test St',
      items: [{ productId: product.id, quantity: 1, unitPrice: parseFloat(product.price) }],
      notes,
    };

    const createRes = await request(BFF_URL)
      .post('/api/orders')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect([200, 201]).toContain(createRes.status);

    // Verify list contains the created order
    const listRes = await request(BFF_URL).get('/api/orders');
    expect(listRes.status).toBe(200);
    const found = (listRes.body?.data || []).some(o => o.notes === notes && o.customerEmail === payload.customerEmail);
    expect(found).toBe(true);
  });
});
