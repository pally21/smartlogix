const { randomInt } = require('crypto');

/**
 * Factory Method Pattern — centraliza la creación de objetos Product.
 * Aplica validaciones y valores por defecto antes de persistir.
 */
class ProductFactory {
  /**
   * Crea la estructura de datos de un producto según su tipo.
   * @param {'physical'|'digital'|'perishable'} type
   * @param {Object} data
   */
  static create(type, data) {
    switch (type) {
      case 'physical':
        return this._createPhysical(data);
      case 'digital':
        return this._createDigital(data);
      case 'perishable':
        return this._createPerishable(data);
      default:
        throw new Error(`Tipo de producto desconocido: ${type}`);
    }
  }

  static _createPhysical(data) {
    return {
      sku: data.sku || this._generateSku('PHY'),
      name: data.name,
      description: data.description || '',
      category: data.category || 'general',
      price: parseFloat(data.price) || 0,
      unit: data.unit || 'unidad',
      minStock: data.minStock || 5,
      isActive: true,
    };
  }

  static _createDigital(data) {
    return {
      sku: data.sku || this._generateSku('DIG'),
      name: data.name,
      description: data.description || '',
      category: 'digital',
      price: parseFloat(data.price) || 0,
      unit: 'licencia',
      minStock: 0, // Digital no tiene límite de stock
      isActive: true,
    };
  }

  static _createPerishable(data) {
    return {
      sku: data.sku || this._generateSku('PER'),
      name: data.name,
      description: data.description || '',
      category: data.category || 'perecedero',
      price: parseFloat(data.price) || 0,
      unit: data.unit || 'kg',
      minStock: data.minStock || 10, // Stock mínimo más alto para perecederos
      isActive: true,
    };
  }

  static _generateSku(prefix) {
    return `${prefix}-${Date.now()}-${randomInt(0, 1000).toString().padStart(3, '0')}`;
  }
}

module.exports = ProductFactory;
