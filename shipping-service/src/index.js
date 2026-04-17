require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const shippingRoutes = require('./routes/shipping');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(helmet()); app.use(cors()); app.use(morgan('combined')); app.use(express.json());
app.use('/shipping', shippingRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'shipping-service' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

sequelize.sync({ alter: true })
  .then(() => app.listen(PORT, () => console.log(`[Shipping] Puerto ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });

module.exports = app;
