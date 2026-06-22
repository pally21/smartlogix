# ${serviceName}

Microservicio REST ligero generado desde el arquetipo `archetype-microservice-simple` de SmartLogix. Ideal para servicios sin base de datos propia (pagos, notificaciones, integraciones externas).

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

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/${serviceName}/health` | Health check |
| POST | `/${serviceName}/process` | Procesar solicitud |
| GET | `/actuator/health` | Health check Spring |
