# ${serviceName}

Microservicio con persistencia JPA generado desde el arquetipo `archetype-microservice-jpa` de SmartLogix.

## Requisitos

- Java 17
- Maven 3.8+
- PostgreSQL 15

## Configuración de base de datos

Crear la base de datos antes de iniciar:

```sql
CREATE DATABASE ${serviceName}_db;
```

Editar credenciales en `src/main/resources/application.properties`.

## Ejecución

```bash
mvn spring-boot:run
```

## Build

```bash
mvn clean package
java -jar target/${artifactId}-${version}.jar
```

## Endpoints generados

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/${serviceName}/${entityName?lower_case}s` | Listar todos |
| GET | `/${serviceName}/${entityName?lower_case}s/{id}` | Obtener por ID |
| POST | `/${serviceName}/${entityName?lower_case}s` | Crear |
| PUT | `/${serviceName}/${entityName?lower_case}s/{id}` | Actualizar |
| DELETE | `/${serviceName}/${entityName?lower_case}s/{id}` | Eliminar |
| GET | `/${serviceName}/${entityName?lower_case}s/health` | Health check |
| GET | `/actuator/health` | Health check Spring |
