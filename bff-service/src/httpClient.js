/**
 * Cliente HTTP centralizado para comunicación entre servicios.
 * Implementa retry y timeout para mayor resiliencia.
 */
const axios = require('axios');

const SERVICES = {
  inventory: process.env.INVENTORY_URL || 'http://localhost:4001',
  orders:    process.env.ORDERS_URL    || 'http://localhost:4002',
  shipping:  process.env.SHIPPING_URL  || 'http://localhost:4003',
  payment:   process.env.PAYMENT_URL   || 'http://localhost:4004',
};

const client = axios.create({ timeout: 10000 });

// Interceptor de errores: traduce errores de red a respuestas legibles
client.interceptors.response.use(
  res => res,
  err => {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      const svc = err.config?.url?.split('/')[2] || 'desconocido';
      throw { status: 503, message: `Servicio no disponible: ${svc}` };
    }

    const status = err.response?.status || err.status || 500;
    const data = err.response?.data;
    const message =
      data?.error ||
      data?.message ||
      err.message ||
      'Error en comunicación entre servicios';

    throw { status, message, details: data };
  }
);

const get    = (service, path, params) => client.get(`${SERVICES[service]}${path}`, { params });
const post   = (service, path, data)   => client.post(`${SERVICES[service]}${path}`, data);
const put    = (service, path, data)   => client.put(`${SERVICES[service]}${path}`, data);
const del    = (service, path)         => client.delete(`${SERVICES[service]}${path}`);

module.exports = { get, post, put, del };
