const { validationResult } = require('express-validator');
const inventoryRepository = require('../repositories/inventoryRepository');
const ProductFactory = require('../factories/productFactory');

class InventoryController {
  // GET /inventory/products
  async getProducts(req, res, next) {
    try {
      const products = await inventoryRepository.findAllProducts(req.query);
      res.json({ success: true, data: products, count: products.length });
    } catch (err) { next(err); }
  }

  // GET /inventory/products/:id
  async getProductById(req, res, next) {
    try {
      const product = await inventoryRepository.findProductById(req.params.id);
      if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  // POST /inventory/products
  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { type = 'physical', ...data } = req.body;

      // Patrón Factory: crea el objeto según el tipo
      const productData = ProductFactory.create(type, data);

      // Verificar SKU único
      const existing = await inventoryRepository.findProductBySku(productData.sku);
      if (existing) return res.status(409).json({ error: `SKU '${productData.sku}' ya existe` });

      const product = await inventoryRepository.createProduct(productData);
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  // PUT /inventory/products/:id
  async updateProduct(req, res, next) {
    try {
      const updated = await inventoryRepository.updateProduct(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }

  // DELETE /inventory/products/:id
  async deleteProduct(req, res, next) {
    try {
      await inventoryRepository.deleteProduct(req.params.id);
      res.json({ success: true, message: 'Producto eliminado (baja lógica)' });
    } catch (err) { next(err); }
  }

  // GET /inventory/products/:id/stock
  async getStock(req, res, next) {
    try {
      const total = await inventoryRepository.getTotalStock(req.params.id);
      res.json({ success: true, productId: req.params.id, totalStock: total });
    } catch (err) { next(err); }
  }

  // POST /inventory/products/:id/stock
  async updateStock(req, res, next) {
    try {
      const { warehouseId, quantity } = req.body;
      if (!warehouseId || quantity === undefined) {
        return res.status(400).json({ error: 'warehouseId y quantity son requeridos' });
      }
      const stock = await inventoryRepository.upsertStock(req.params.id, warehouseId, quantity);
      res.json({ success: true, data: stock });
    } catch (err) { next(err); }
  }

  // POST /inventory/products/:id/decrease
  async decreaseStock(req, res, next) {
    try {
      const { quantity } = req.body;
      if (!quantity) return res.status(400).json({ error: 'quantity es requerido' });
      const stock = await inventoryRepository.decreaseStock(req.params.id, quantity);
      res.json({ success: true, data: stock });
    } catch (err) { next(err); }
  }

  // POST /inventory/stocks/restore
  async restoreStock(req, res, next) {
    try {
      const { deductions } = req.body;
      if (!Array.isArray(deductions) || deductions.length === 0) {
        return res.status(400).json({ error: 'deductions es requerido y debe ser un arreglo no vacío' });
      }
      const restored = await inventoryRepository.restoreStock(deductions);
      res.json({ success: true, data: restored });
    } catch (err) { next(err); }
  }

  // GET /inventory/warehouses
  async getWarehouses(req, res, next) {
    try {
      const warehouses = await inventoryRepository.findAllWarehouses();
      res.json({ success: true, data: warehouses });
    } catch (err) { next(err); }
  }

  // POST /inventory/warehouses
  async createWarehouse(req, res, next) {
    try {
      const warehouse = await inventoryRepository.createWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (err) { next(err); }
  }

  // DELETE /inventory/warehouses/:id
  async deleteWarehouse(req, res, next) {
    try {
      const deleted = await inventoryRepository.deleteWarehouse(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Bodega no encontrada' });
      res.json({ success: true, message: 'Bodega eliminada (baja lógica)' });
    } catch (err) { next(err); }
  }
}

module.exports = new InventoryController();
