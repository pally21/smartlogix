/**
 * Circuit Breaker Pattern — protege el servicio de fallos en cascada.
 * Estados: CLOSED (normal) → OPEN (fallo) → HALF_OPEN (prueba)
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTime     = options.recoveryTime     || 30000; // 30 seg
    this.timeout          = options.timeout          || 5000;  // 5 seg

    this.state        = 'CLOSED';
    this.failureCount = 0;
    this.lastFailTime = null;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailTime;
      if (elapsed > this.recoveryTime) {
        this.state = 'HALF_OPEN';
        console.log('[CircuitBreaker] Estado → HALF_OPEN, probando recuperación...');
      } else {
        throw new Error('Circuit Breaker ABIERTO: servicio no disponible temporalmente');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        ),
      ]);
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('[CircuitBreaker] Estado → CLOSED. Servicio recuperado.');
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`[CircuitBreaker] Estado → OPEN. Fallos: ${this.failureCount}`);
    }
  }

  getStatus() {
    return { state: this.state, failureCount: this.failureCount };
  }
}

// Middleware Express que aplica circuit breaker a una función async
const withCircuitBreaker = (breaker, fn) => async (req, res, next) => {
  try {
    await breaker.call(() => fn(req, res, next));
  } catch (err) {
    if (err.message.includes('Circuit Breaker')) {
      return res.status(503).json({ error: err.message, status: breaker.getStatus() });
    }
    next(err);
  }
};

module.exports = { CircuitBreaker, withCircuitBreaker };
