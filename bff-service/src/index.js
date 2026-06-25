require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware de seguridad ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: 'Demasiadas solicitudes' } });
app.use(limiter);

// ── Rutas de autenticación (no protegidas) ────────────────────────────────
app.use('/api/auth', require('./authRoutes'));

// ── Aplicar verificación de token globalmente a rutas protegidas ───────────
const { verifyToken } = require('./authMiddleware');
app.use('/api', verifyToken);

// ── Rutas BFF (agrega llamadas a microservicios) ─────────────────────────────
app.use('/api/inventory',  require('./routes/inventoryBff'));
app.use('/api/orders',     require('./routes/ordersBff'));
app.use('/api/shipping',   require('./routes/shippingBff'));
app.use('/api/payment',    require('./routes/paymentBff'));
app.use('/api/dashboard',  require('./routes/dashboardBff'));

// Prometheus metrics endpoint
const { exposeMetrics } = require('./httpClient');
app.get('/metrics', async (req, res) => {
  try {
    const body = await exposeMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(body);
  } catch (e) {
    res.status(500).send('metrics error');
  }
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'bff-service', timestamp: new Date() }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const message = err?.message || err?.error || 'Error interno del BFF';
  console.error('[BFF] Error:', message, err?.details ? JSON.stringify(err.details) : '');
  res.status(err?.status || 500).json({ error: message });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[BFF] Corriendo en puerto ${PORT}`));
}

module.exports = app;
