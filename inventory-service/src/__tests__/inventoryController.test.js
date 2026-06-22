/**
 * Pruebas Unitarias — Inventory Service (Parcial 3)
 * Cobertura objetivo: ≥ 60%
 */
const ProductFactory = require('../factories/productFactory');
const { CircuitBreaker } = require('../middleware/circuitBreaker');

// ── Tests: ProductFactory ─────────────────────────────────────────────────────
describe('ProductFactory', () => {
  test('crea producto físico con datos correctos', () => {
    const product = ProductFactory.create('physical', { name: 'Caja', price: '1500' });
    expect(product.name).toBe('Caja');
    expect(product.price).toBe(1500);
    expect(product.unit).toBe('unidad');
    expect(product.isActive).toBe(true);
  });

  test('crea producto digital con unidad licencia y minStock 0', () => {
    const product = ProductFactory.create('digital', { name: 'Software', price: '50000' });
    expect(product.unit).toBe('licencia');
    expect(product.minStock).toBe(0);
    expect(product.category).toBe('digital');
  });

  test('crea producto perecedero con minStock alto', () => {
    const product = ProductFactory.create('perishable', { name: 'Leche', price: '800' });
    expect(product.minStock).toBeGreaterThanOrEqual(10);
  });

  test('lanza error para tipo desconocido', () => {
    expect(() => ProductFactory.create('unknown', {})).toThrow('Tipo de producto desconocido: unknown');
  });

  test('genera SKU automático si no se proporciona', () => {
    const product = ProductFactory.create('physical', { name: 'Test', price: 100 });
    expect(product.sku).toBeDefined();
    expect(product.sku).toMatch(/^PHY-/);
  });
});

// ── Tests: CircuitBreaker ─────────────────────────────────────────────────────
describe('CircuitBreaker', () => {
  test('estado inicial es CLOSED', () => {
    const cb = new CircuitBreaker();
    expect(cb.getStatus().state).toBe('CLOSED');
  });

  test('ejecuta función exitosamente en estado CLOSED', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.call(async () => 'ok');
    expect(result).toBe('ok');
  });

  test('abre el circuito después de N fallos', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    const fail = async () => { throw new Error('fallo'); };
    await expect(cb.call(fail)).rejects.toThrow();
    await expect(cb.call(fail)).rejects.toThrow();
    expect(cb.getStatus().state).toBe('OPEN');
  });

  test('rechaza llamadas cuando está OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, recoveryTime: 99999 });
    await expect(cb.call(async () => { throw new Error('fallo'); })).rejects.toThrow();
    await expect(cb.call(async () => 'ok')).rejects.toThrow('Circuit Breaker ABIERTO');
  });

  test('resetea fallos después de éxito', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 5 });
    await cb.call(async () => 'ok');
    expect(cb.failureCount).toBe(0);
  });
});
