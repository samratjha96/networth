# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy package files
COPY package.json .
COPY bun.lockb .

# Set build arguments
ARG NODE_ENV=production
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_USE_SUPABASE
ARG VITE_SUPABASE_TEST_USER_EMAIL
ARG VITE_SUPABASE_TEST_USER_PASSWORD

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_USE_SUPABASE=$VITE_USE_SUPABASE
ENV VITE_SUPABASE_TEST_USER_EMAIL=$VITE_SUPABASE_TEST_USER_EMAIL
ENV VITE_SUPABASE_TEST_USER_PASSWORD=$VITE_SUPABASE_TEST_USER_PASSWORD

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Install serve
RUN bun add -g serve

# Copy the built app from build stage
COPY --from=build /app/dist .

# Expose port 8080
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Start serve with production optimizations
CMD ["serve", "-p", "8080", "-l", "tcp://0.0.0.0:8080", "--single", "--no-clipboard", "--no-compression", "."]
