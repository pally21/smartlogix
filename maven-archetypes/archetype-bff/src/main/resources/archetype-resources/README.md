# ${serviceName}

Backend For Frontend generado desde el arquetipo `archetype-bff` de SmartLogix.

## Requisitos

- Java 17
- Maven 3.8+

## Ejecución

```bash
mvn spring-boot:run
```

## Build

```bash
mvn clean package
java -jar target/${artifactId}-${version}.jar
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Productos (via Inventory Service) |
| GET | `/api/health` | Health check del BFF |
| GET | `/actuator/health` | Health check de Spring |

## Configuración

Editar `src/main/resources/application.properties` para cambiar las URLs de los microservicios.
