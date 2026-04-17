require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/orders', ordersRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'orders-service', timestamp: new Date() });
});

app.use((err, req, res, next) => {
  const message = err?.message || err?.error || 'Error interno';
  console.error('[Orders] Error handler:', message, err?.stack || '');
  res.status(err?.status || 500).json({ error: message });
});

sequelize.sync({ alter: true })
  .then(() => {
    console.log('[Orders] Base de datos sincronizada.');
    app.listen(PORT, () => console.log(`[Orders] Servicio corriendo en puerto ${PORT}`));
  })
  .catch(err => { console.error('[Orders] DB Error:', err); process.exit(1); });

module.exports = app;
