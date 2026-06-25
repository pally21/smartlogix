require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 4001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/inventory', inventoryRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service', timestamp: new Date() });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
sequelize.sync({ alter: true })
  .then(() => {
    console.log('[Inventory] Base de datos sincronizada.');
    app.listen(PORT, () => console.log(`[Inventory] Servicio corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('[Inventory] Error al conectar con la base de datos:', err);
    process.exit(1);
  });

module.exports = app; // para tests
