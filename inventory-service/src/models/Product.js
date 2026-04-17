const { DataTypes } = require('sequelize');

// ── Entidad Producto (@Entity equivalente) ───────────────────────────────────
module.exports = (sequelize) => sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING(100),
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'unidad',
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'min_stock',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});
