# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy the built app from build stage
COPY --from=build /app/dist .

# Expose port 8080
EXPOSE 8080

# Start serve on port 8080 and listen on all interfaces
CMD ["serve", "-p", "8080", "-l", "tcp://0.0.0.0:8080", "."]
