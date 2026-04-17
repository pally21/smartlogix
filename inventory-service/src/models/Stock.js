const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'warehouse_id',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reservedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'reserved_quantity',
  },
}, {
  tableName: 'stocks',
  timestamps: true,
  underscored: true,
});
