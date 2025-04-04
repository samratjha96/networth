# Use Node.js LTS image
FROM node:20-slim
WORKDIR /usr/src/app

# Set build arguments and environment variables
ARG NODE_ENV=production
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_USE_SUPABASE
ARG VITE_SUPABASE_TEST_USER_EMAIL
ARG VITE_SUPABASE_TEST_USER_PASSWORD

ENV NODE_ENV=$NODE_ENV
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_USE_SUPABASE=$VITE_USE_SUPABASE
ENV VITE_SUPABASE_TEST_USER_EMAIL=$VITE_SUPABASE_TEST_USER_EMAIL
ENV VITE_SUPABASE_TEST_USER_PASSWORD=$VITE_SUPABASE_TEST_USER_PASSWORD

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Install global packages needed for build and serve
RUN npm install -g serve vite

# Build the app
RUN npm run build

# Use non-root user
USER node

# Expose port 8080
EXPOSE 8080

# Start serve with production optimizations
CMD ["serve", "-p", "8080", "-l", "tcp://0.0.0.0:8080", "--single", "--no-clipboard", "--no-compression", "dist"]
