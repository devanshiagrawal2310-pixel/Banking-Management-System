# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy all Java source files
COPY BankAccount.java BankingManagementSystem.java BankingWebServer.java ./

# Compile
RUN javac BankAccount.java BankingManagementSystem.java BankingWebServer.java

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy compiled classes from build stage
COPY --from=build /app/*.class ./

# Copy static web files
COPY web/ ./web/

# Render sets the PORT env variable; default to 8080
ENV PORT=8080
EXPOSE 8080

# Use shell form so $PORT env var is expanded at runtime
CMD java BankingWebServer $PORT
