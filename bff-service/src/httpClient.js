/**
 * Cliente HTTP centralizado para comunicación entre servicios.
 * Implementa retry y timeout para mayor resiliencia.
 */
const axios = require('axios');
const CircuitBreaker = require('opossum');
const clientMetrics = require('prom-client');

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

// Circuit breaker options (tune as needed)
const breakerOptions = { timeout: 12000, errorThresholdPercentage: 50, resetTimeout: 30000 };

// Prometheus metrics
const register = new clientMetrics.Registry();
clientMetrics.collectDefaultMetrics({ register });
const cbSuccess = new clientMetrics.Counter({ name: 'bff_cb_success_total', help: 'Circuit breaker success count', registers: [register], labelNames: ['service'] });
const cbFailure = new clientMetrics.Counter({ name: 'bff_cb_failure_total', help: 'Circuit breaker failure count', registers: [register], labelNames: ['service'] });
const cbState = new clientMetrics.Gauge({ name: 'bff_cb_state', help: 'Circuit breaker state (0 closed,1 open,2 half-open)', registers: [register], labelNames: ['service'] });

function exposeMetrics() { return register.metrics(); }

// Create one breaker per service
const breakers = Object.keys(SERVICES).reduce((acc, svc) => {
  const fn = (config) => client.request(config);
  const breaker = new CircuitBreaker(fn, breakerOptions);
  breaker.fallback(() => { throw { status: 503, message: `Fallback: servicio ${svc} no disponible` }; });
  // metrics listeners
  breaker.on('success', () => cbSuccess.inc({ service: svc }));
  breaker.on('failure', () => cbFailure.inc({ service: svc }));
  breaker.on('open', () => cbState.set({ service: svc }, 1));
  breaker.on('halfOpen', () => cbState.set({ service: svc }, 2));
  breaker.on('close', () => cbState.set({ service: svc }, 0));
  acc[svc] = breaker;
  return acc;
}, {});

function buildConfig(service, method, path, opts = {}) {
  return Object.assign({
    method,
    url: `${SERVICES[service]}${path}`,
  }, opts);
}

const get  = (service, path, params) => breakers[service].fire(buildConfig(service, 'get', path, { params }));
const post = (service, path, data)   => breakers[service].fire(buildConfig(service, 'post', path, { data }));
const put  = (service, path, data)   => breakers[service].fire(buildConfig(service, 'put', path, { data }));
const del  = (service, path)         => breakers[service].fire(buildConfig(service, 'delete', path));

module.exports = { get, post, put, del, exposeMetrics };
