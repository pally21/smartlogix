# SmartLogix — Arquetipos Maven

Colección de arquetipos Maven que sirven como plantillas base para generar componentes backend del sistema SmartLogix.

## Arquetipos disponibles

| Arquetipo | Descripción | Puerto por defecto |
|---|---|---|
| `archetype-bff` | Backend For Frontend con Spring Boot + WebFlux | 8080 |
| `archetype-microservice-jpa` | Microservicio con Spring Boot + JPA + PostgreSQL | 8081 |
| `archetype-microservice-simple` | Microservicio REST ligero sin base de datos | 8082 |

## Requisitos previos

- Java 17
- Maven 3.8+
- PostgreSQL 15 (solo para `archetype-microservice-jpa`)

## Cómo instalar un arquetipo localmente

Desde la carpeta del arquetipo que quieres instalar:

```bash
cd archetype-bff
mvn install
```

Repetir para cada arquetipo:

```bash
cd ../archetype-microservice-jpa && mvn install
cd ../archetype-microservice-simple && mvn install
```

## Cómo generar un nuevo proyecto desde un arquetipo

### Generar un BFF

```bash
mvn archetype:generate \
  -DarchetypeGroupId=cl.smartlogix.archetypes \
  -DarchetypeArtifactId=archetype-bff \
  -DarchetypeVersion=1.0.0 \
  -DgroupId=cl.smartlogix \
  -DartifactId=mi-bff \
  -Dversion=1.0.0 \
  -DserviceName=mi-bff \
  -DservicePort=8080 \
  -DinteractiveMode=false
```

### Generar un microservicio con JPA

```bash
mvn archetype:generate \
  -DarchetypeGroupId=cl.smartlogix.archetypes \
  -DarchetypeArtifactId=archetype-microservice-jpa \
  -DarchetypeVersion=1.0.0 \
  -DgroupId=cl.smartlogix \
  -DartifactId=mi-microservicio \
  -Dversion=1.0.0 \
  -DserviceName=mi-microservicio \
  -DservicePort=8081 \
  -DentityName=Producto \
  -DinteractiveMode=false
```

### Generar un microservicio simple

```bash
mvn archetype:generate \
  -DarchetypeGroupId=cl.smartlogix.archetypes \
  -DarchetypeArtifactId=archetype-microservice-simple \
  -DarchetypeVersion=1.0.0 \
  -DgroupId=cl.smartlogix \
  -DartifactId=mi-servicio \
  -Dversion=1.0.0 \
  -DserviceName=mi-servicio \
  -DservicePort=8082 \
  -DinteractiveMode=false
```

## Parámetros configurables

| Parámetro | Descripción | Aplica a |
|---|---|---|
| `groupId` | Group ID Maven del proyecto generado | Todos |
| `artifactId` | Artifact ID Maven | Todos |
| `version` | Versión del proyecto | Todos |
| `serviceName` | Nombre del servicio (usado en rutas y propiedades) | Todos |
| `servicePort` | Puerto en que corre el servicio | Todos |
| `entityName` | Nombre de la entidad JPA (ej: `Producto`, `Pedido`) | Solo JPA |

## Estructura generada

### archetype-bff genera:
```
mi-bff/
├── pom.xml
└── src/main/
    ├── java/cl/smartlogix/bff/
    │   ├── BffApplication.java
    │   └── controller/BffController.java
    └── resources/
        └── application.properties
```

### archetype-microservice-jpa genera:
```
mi-microservicio/
├── pom.xml
└── src/main/
    ├── java/cl/smartlogix/service/
    │   ├── ServiceApplication.java
    │   ├── controller/{EntityName}Controller.java
    │   ├── model/{EntityName}.java
    │   └── repository/{EntityName}Repository.java
    └── resources/
        └── application.properties
```

### archetype-microservice-simple genera:
```
mi-servicio/
├── pom.xml
└── src/main/
    ├── java/cl/smartlogix/service/
    │   ├── ServiceApplication.java
    │   └── controller/ServiceController.java
    └── resources/
        └── application.properties
```
