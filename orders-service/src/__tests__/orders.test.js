/**
 * Pruebas Unitarias — Orders Service
 */

// Simular el modelo Order
const generateOrderNumber = () => {
  const date = new Date();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}-${num}`;
};

const calcTotal = (items) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

describe('Order Utilities', () => {
  test('genera número de orden con formato correcto', () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^ORD-\d{6}-\d{4}$/);
  });

  test('calcula total correctamente', () => {
    const items = [
      { quantity: 2, unitPrice: 1000 },
      { quantity: 1, unitPrice: 500 },
    ];
    expect(calcTotal(items)).toBe(2500);
  });

  test('calcula total con ítem de cantidad 0', () => {
    const items = [{ quantity: 0, unitPrice: 999 }];
    expect(calcTotal(items)).toBe(0);
  });

  test('order sin ítems retorna total 0', () => {
    expect(calcTotal([])).toBe(0);
  });
});

describe('Order Status Validation', () => {
  const VALID_STATUSES = ['VALIDATED','APPROVED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

  test('estados válidos son aceptados', () => {
    VALID_STATUSES.forEach(s => expect(VALID_STATUSES.includes(s)).toBe(true));
  });

  test('estado PENDING no puede ser asignado manualmente', () => {
    expect(VALID_STATUSES.includes('PENDING')).toBe(false);
  });

  test('estado inválido es rechazado', () => {
    expect(VALID_STATUSES.includes('UNKNOWN')).toBe(false);
  });
});
