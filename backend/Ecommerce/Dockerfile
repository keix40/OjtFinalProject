# Build the Spring Boot application.
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

# Run the packaged application in a smaller Java runtime image.
FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/Ecommerce-0.0.1-SNAPSHOT.jar app.jar

# Render provides the PORT environment variable at runtime.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
