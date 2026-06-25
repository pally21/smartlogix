# E2E test scripts

Script para ejecutar una prueba E2E mínima que crea un pedido vía el BFF y verifica que se persista.

Uso:

```bash
chmod +x scripts/e2e/test_order_e2e.sh
scripts/e2e/test_order_e2e.sh
# o
BFF_URL=http://localhost:4000 scripts/e2e/test_order_e2e.sh
```

Requisitos:
- `curl`
- `python3`

Desde el servicio `orders-service` (Jest):

```bash
cd orders-service
npm run test:e2e
```

Salida:
- Código de salida `0` si la prueba pasa.
- Código distinto de `0` si falla.
