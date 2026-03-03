# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY qt-platform-common/pom.xml qt-platform-common/
COPY qt-platform-user/pom.xml qt-platform-user/
COPY qt-platform-product/pom.xml qt-platform-product/
COPY qt-platform-comment/pom.xml qt-platform-comment/
COPY qt-platform-file/pom.xml qt-platform-file/
COPY qt-platform-admin/pom.xml qt-platform-admin/
COPY qt-platform-app/pom.xml qt-platform-app/
RUN mvn dependency:go-offline -B

COPY . .
RUN mvn clean package -DskipTests -B

# ===== Stage 2: Run =====
FROM eclipse-temurin:17-jre-alpine
LABEL maintainer="qt-platform"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder /build/qt-platform-app/target/*.jar app.jar

RUN mkdir -p /app/uploads /app/logs && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8081

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:8081/api/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
