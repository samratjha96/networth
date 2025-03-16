# Use Node.js LTS image
FROM node:20-slim AS base
WORKDIR /usr/src/app

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

# Install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package*.json /temp/dev/
RUN cd /temp/dev && npm install

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package*.json /temp/prod/
RUN cd /temp/prod && npm install --omit=dev

# Build stage with dev dependencies
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set NODE_ENV to production for the build
ENV NODE_ENV=production
ENV PATH="/usr/src/app/node_modules/.bin:${PATH}"

# Build the app
RUN npm run build

# Production stage
FROM base AS release
# Install serve globally in production
RUN npm install -g serve

# Copy only the built assets and production dependencies
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=build /usr/src/app/dist dist

# Use non-root user
USER node

# Expose port 8080
EXPOSE 8080

# Start serve with production optimizations
CMD ["serve", "-p", "8080", "-l", "tcp://0.0.0.0:8080", "--single", "--no-clipboard", "--no-compression", "dist"]
