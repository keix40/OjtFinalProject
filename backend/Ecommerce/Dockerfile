# Multi-stage build: Maven (Eclipse Temurin 17) → JRE runtime.
# Build context: backend/Ecommerce (see render.yaml dockerContext).

FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/Ecommerce-0.0.1-SNAPSHOT.jar app.jar

# Empty upload/static dirs (WebConfig ResourceHandlers). Uploaded files are NOT in the image;
# on Render the filesystem is ephemeral — use a persistent disk or object storage (R2/S3) for production assets.
RUN mkdir -p product_image uploads review return_images brand_and_category_image event

# Render injects PORT at runtime; default 8080 for local docker run.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
