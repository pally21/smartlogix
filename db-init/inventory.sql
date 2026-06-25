-- SmartLogix — Seed de Inventario
-- Las tablas son creadas por Sequelize sync() automáticamente antes de este script.

DO $$
BEGIN
  -- Bodegas
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warehouses') THEN
    IF NOT EXISTS (SELECT 1 FROM warehouses LIMIT 1) THEN
      INSERT INTO warehouses (id, name, location, capacity, is_active, created_at, updated_at) VALUES
        ('a1b2c3d4-0001-0001-0001-000000000001', 'Bodega Central Santiago',  'Av. Américo Vespucio 1234, Pudahuel, Santiago', 5000, true, NOW(), NOW()),
        ('a1b2c3d4-0002-0002-0002-000000000002', 'Bodega Norte Antofagasta', 'Av. Balmaceda 890, Antofagasta',                2000, true, NOW(), NOW()),
        ('a1b2c3d4-0003-0003-0003-000000000003', 'Bodega Sur Concepción',    'Freire 1560, Concepción',                       1500, true, NOW(), NOW());
    END IF;
  END IF;

  -- Productos
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
      INSERT INTO products (id, sku, name, description, category, price, unit, min_stock, is_active, created_at, updated_at) VALUES
        ('b1b2c3d4-0001-0001-0001-000000000001', 'PHY-001', 'Notebook HP 15"',        'Notebook HP Core i5, 8GB RAM, 256GB SSD', 'Electrónica',  499990, 'unidad', 3, true, NOW(), NOW()),
        ('b1b2c3d4-0002-0002-0002-000000000002', 'PHY-002', 'Mouse Inalámbrico',      'Mouse óptico inalámbrico USB',             'Electrónica',   19990, 'unidad', 5, true, NOW(), NOW()),
        ('b1b2c3d4-0003-0003-0003-000000000003', 'PHY-003', 'Teclado Mecánico',       'Teclado mecánico RGB retroiluminado',      'Electrónica',   49990, 'unidad', 5, true, NOW(), NOW()),
        ('b1b2c3d4-0004-0004-0004-000000000004', 'DIG-001', 'Licencia Office 365',    'Suscripción anual Microsoft 365',          'Software',      89990, 'licencia',0, true, NOW(), NOW()),
        ('b1b2c3d4-0005-0005-0005-000000000005', 'PHY-004', 'Monitor 24" Full HD',    'Monitor LED Full HD 75Hz HDMI',            'Electrónica',  149990, 'unidad', 2, true, NOW(), NOW());
    END IF;
  END IF;

  -- Stock
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stocks') THEN
    IF NOT EXISTS (SELECT 1 FROM stocks LIMIT 1) THEN
      INSERT INTO stocks (id, product_id, warehouse_id, quantity, reserved_quantity, created_at, updated_at) VALUES
        (gen_random_uuid(), 'b1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 15, 0, NOW(), NOW()),
        (gen_random_uuid(), 'b1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', 40, 0, NOW(), NOW()),
        (gen_random_uuid(), 'b1b2c3d4-0003-0003-0003-000000000003', 'a1b2c3d4-0001-0001-0001-000000000001', 20, 0, NOW(), NOW()),
        (gen_random_uuid(), 'b1b2c3d4-0004-0004-0004-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001', 50, 0, NOW(), NOW()),
        (gen_random_uuid(), 'b1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0002-0002-0002-000000000002',  3, 0, NOW(), NOW());
    END IF;
  END IF;
END $$;
