/**
 * Repository Pattern — abstrae el acceso a datos (equivalente a JpaRepository en Spring).
 * El controlador nunca toca Sequelize directamente: solo llama a este repositorio.
 */
const { Product, Stock, Warehouse } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

class InventoryRepository {
  // ── Productos ───────────────────────────────────────────────────────────────
  async findAllProducts(filters = {}) {
    const where = { isActive: true };
    if (filters.category) where.category = filters.category;
    if (filters.search) where.name = { [Op.iLike]: `%${filters.search}%` };
    return Product.findAll({ where, include: [{ model: Stock, as: 'stocks' }] });
  }

  async findProductById(id) {
    return Product.findOne({
      where: { id, isActive: true },
      include: [{ model: Stock, as: 'stocks', include: [{ model: Warehouse, as: 'warehouse' }] }],
    });
  }

  async findProductBySku(sku) {
    return Product.findOne({ where: { sku } });
  }

  async createProduct(data) {
    return Product.create(data);
  }

  async updateProduct(id, data) {
    const [affected, rows] = await Product.update(data, { where: { id }, returning: true });
    return affected > 0 ? rows[0] : null;
  }

  async deleteProduct(id) {
    return Product.update({ isActive: false }, { where: { id } });
  }

  // ── Stock ────────────────────────────────────────────────────────────────────
  async findStock(productId, warehouseId) {
    return Stock.findOne({ where: { productId, warehouseId } });
  }

  async upsertStock(productId, warehouseId, quantity) {
    const [stock] = await Stock.findOrCreate({
      where: { productId, warehouseId },
      defaults: { productId, warehouseId, quantity },
    });
    if (stock.quantity !== quantity) {
      stock.quantity = quantity;
      await stock.save();
    }
    return stock;
  }

  async decreaseStock(productId, quantity) {
    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      throw new Error('Cantidad inválida para descuento de stock');
    }

    return sequelize.transaction(async (t) => {
      const stocks = await Stock.findAll({
        where: { productId, quantity: { [Op.gt]: 0 } },
        order: [['quantity', 'DESC']],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      const totalAvailable = stocks.reduce((total, s) => total + Number(s.quantity || 0), 0);
      if (totalAvailable < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${totalAvailable}`);
      }

      let remaining = Number(quantity);
      const deductions = [];

      for (const stock of stocks) {
        if (remaining <= 0) break;
        const currentQty = Number(stock.quantity || 0);
        const deducted = Math.min(currentQty, remaining);
        if (deducted <= 0) continue;

        stock.quantity = currentQty - deducted;
        await stock.save({ transaction: t });

        deductions.push({
          stockId: stock.id,
          warehouseId: stock.warehouseId,
          quantity: deducted,
        });
        remaining -= deducted;
      }

      return {
        productId,
        requested: Number(quantity),
        totalAvailableBefore: totalAvailable,
        totalAvailableAfter: totalAvailable - Number(quantity),
        deductions,
      };
    });
  }

  async restoreStock(deductions = []) {
    if (!Array.isArray(deductions) || deductions.length === 0) {
      throw new Error('deductions es requerido para restaurar stock');
    }

    return sequelize.transaction(async (t) => {
      let restoredQuantity = 0;
      for (const item of deductions) {
        const qty = Number(item.quantity);
        if (!item.stockId || !Number.isFinite(qty) || qty <= 0) continue;

        const stock = await Stock.findByPk(item.stockId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!stock) continue;

        stock.quantity = Number(stock.quantity || 0) + qty;
        await stock.save({ transaction: t });
        restoredQuantity += qty;
      }

      return { restoredQuantity, restoredItems: deductions.length };
    });
  }

  async getTotalStock(productId) {
    const stocks = await Stock.findAll({ where: { productId } });
    return stocks.reduce((total, s) => total + s.quantity, 0);
  }

  // ── Bodegas ──────────────────────────────────────────────────────────────────
  async findAllWarehouses() {
    return Warehouse.findAll({ where: { isActive: true } });
  }

  async createWarehouse(data) {
    return Warehouse.create(data);
  }

  async deleteWarehouse(id) {
    const [affected] = await Warehouse.update({ isActive: false }, { where: { id } });
    return affected > 0;
  }
}

module.exports = new InventoryRepository(); // Singleton
