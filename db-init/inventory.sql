-- ============================================================
-- SmartLogix — Inicialización BD Inventario
-- ============================================================

-- Las tablas son creadas por Sequelize sync() automáticamente.
-- Este script agrega datos de ejemplo (seed).

-- Se ejecuta DESPUÉS de que Sequelize crea las tablas,
-- por eso está en un script separado y puede fallar si las
-- tablas no existen aún (el HEALTHCHECK garantiza el orden).

DO $$
BEGIN
  -- Solo insertar si la tabla existe y está vacía
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warehouses') THEN
    IF NOT EXISTS (SELECT 1 FROM warehouses LIMIT 1) THEN
      INSERT INTO warehouses (id, name, location, capacity, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Bodega Central Santiago',   'Av. Américo Vespucio 1234, Pudahuel',   5000, true, NOW(), NOW()),
        (gen_random_uuid(), 'Bodega Norte Antofagasta',  'Av. Balmaceda 890, Antofagasta',         2000, true, NOW(), NOW()),
        (gen_random_uuid(), 'Bodega Sur Concepción',     'Freire 1560, Concepción',                1500, true, NOW(), NOW());
    END IF;
  END IF;
END $$;
