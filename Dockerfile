# ---------- Build Stage ----------
FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /app

COPY library/pom.xml .
COPY library/.mvn .mvn
COPY library/mvnw .
COPY library/src src

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java","-jar","app.jar"]