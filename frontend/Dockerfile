FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# 1. Catch the arguments passed from docker-compose.yml
ARG VITE_GATEWAY_URL
ARG VITE_GOOGLE_CLIENT_ID

# 2. Assign them to environment variables so Vite reads them during build
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Run the build command (generates the /dist folder)
RUN npm run build

# STAGE 2: Delivery Stage
FROM alpine:latest

WORKDIR /app/dist_build

# Copy the build output from stage 1 into image storage
COPY --from=builder /app/dist .

# Force-sync fresh dist files into the mounted volume on startup
CMD ["sh", "-c", "cp -rf /app/dist_build/* /app/dist/ && echo 'Frontend build synced to volume.'"]