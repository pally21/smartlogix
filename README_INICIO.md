# 🚀 SmartLogix — Cómo levantar el proyecto

## Requisitos
- Docker Desktop instalado y corriendo
- Puerto 8082 y 3001 libres en tu computador

---

## ▶️ Levantar todo con un comando

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
docker compose up --build
```

Espera ~2-3 minutos mientras se construyen las imágenes y arrancan las bases de datos.

---

## 🌐 Acceder a la aplicación

Una vez levantado, abre tu navegador en:

**http://localhost:3001**

O también directo por el gateway en:

**http://localhost:8082**

---

## 🔐 Login

- **Usuario:** `admin`
- **Contraseña:** `password`

---

## 📦 Servicios disponibles

| Servicio         | Puerto | Descripción                     |
|------------------|--------|---------------------------------|
| Frontend React   | 3001   | Interfaz de usuario             |
| Nginx (Gateway)  | 8082   | API Gateway / proxy reverso     |
| BFF              | 4000   | Backend for Frontend            |
| Inventario       | 4001   | Productos y stock               |
| Pedidos          | 4002   | Gestión de órdenes              |
| Envíos           | 4003   | Coordinación de despachos       |
| Pagos            | 4004   | Procesamiento de pagos (sandbox)|

---

## 💳 Pagos en modo Sandbox

El sistema de pagos funciona en modo **SANDBOX** (simulación) por defecto.
No necesitas claves de Stripe ni MercadoPago.

Si quieres integrar una pasarela real, edita el archivo `.env`:
```
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_REAL
```

---

## 🛑 Apagar el sistema

```bash
docker compose down
```

Para borrar también los datos de las bases de datos:

```bash
docker compose down -v
```

---

## ❗ Solución de problemas

**Error: port already in use**
→ Cambia el puerto en `docker-compose.yml`, por ejemplo `"8083:80"` si el 8082 está ocupado.

**Los contenedores se reinician solos**
→ Espera 1-2 minutos. Las bases de datos demoran en inicializarse.
→ Si persiste: `docker compose down -v` y vuelve a hacer `docker compose up --build`
