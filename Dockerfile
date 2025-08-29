# Use Node.js 22 LTS for better performance and compatibility
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy root package files first
COPY package*.json ./

# Copy workspace configuration
COPY packages/ ./packages/

# Install root dependencies
RUN npm ci --omit=dev

# Install client dependencies
WORKDIR /app/packages/client
RUN npm ci --omit=dev

# Build the client application
RUN npm run build

# Go back to root directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Create PM2 ecosystem file
RUN echo 'module.exports = { apps: [{ name: "pastoragenda", script: "npx", args: "serve -s packages/client/dist -l 4000", cwd: "/app", env: { NODE_ENV: "production", PORT: 4000 } }] };' > ecosystem.config.js

# Expose the port the app will run on
EXPOSE 4000

# Health check to ensure the app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/ || exit 1

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]