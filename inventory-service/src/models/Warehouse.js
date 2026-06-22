const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Warehouse', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(250),
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'warehouses',
  timestamps: true,
  underscored: true,
});
