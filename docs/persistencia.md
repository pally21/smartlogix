# Persistencia de datos — SmartLogix

Este documento describe cómo se garantiza la persistencia de datos en los microservicios del proyecto SmartLogix.

Arquitectura y tecnologías:
- Base de datos: PostgreSQL (contenedores `*-db` por microservicio).
- ORM: Sequelize (cada microservicio usa modelos y migraciones locales).
- Esquema: cada microservicio mantiene su propio esquema y base de datos aislada (BD por servicio).

Garantías de persistencia:
- Transacciones: las operaciones que implican múltiples tablas o creación de pedidos usan transacciones (`sequelize.transaction`) para mantener consistencia (ej. `ordersRepository.create`).
- Integridad referencial: se usan claves primarias UUID y relaciones entre tablas (Order — OrderItem) gestionadas por Sequelize.
- Inicialización: los contenedores `*-db` ejecutan scripts en `db-init/*.sql` durante la creación para poblar datos demo y esquemas.
- Recuperación ante error: los controladores detectan fallos en operaciones remotas (e.g., descontar stock) y ejecutan procedimientos compensatorios (e.g., `rollbackStock`) para restaurar stock.

Buenas prácticas en el código:
- Repositories: patrón `Repository` para separar acceso a datos y lógica de negocio.
- Factories: uso de `ProductFactory` para normalizar creación de entidades.
- Migrations/Seeds: incluir migraciones y seeds es recomendado (actual repo usa scripts SQL en `db-init/`).

Recomendaciones operacionales:
- Respaldos regulares de las bases de datos PostgreSQL.
- Monitoreo de latencia y índices en campos de búsqueda.
- Mantener las migraciones en control de versiones y ejecutar durante despliegues.
