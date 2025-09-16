# --- STAGE 1: The Builder ---
# This stage correctly builds your React app. It does not need any changes.
FROM node:22-alpine AS builder

WORKDIR /app

# Define ARGs for build-time secrets
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Copy package configurations
COPY package*.json ./
COPY packages/ ./packages/

# Install ALL dependencies, including devDependencies for the build
RUN npm install

# Copy the rest of the source code
COPY . .

# Make secrets available to the build script
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the client workspace
RUN npm run build --workspace=@pastoragenda/client


# --- STAGE 2: The Final Nginx Production Image ---
# This is the corrected stage that builds the Nginx server.
FROM nginx:stable-alpine

# Copy the built React app from the 'builder' stage to the Nginx web root directory
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Copy your custom Nginx configuration file into the container
# This assumes your nginx config file is named "nginx.conf" in your project root
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80, which is the default for Nginx
EXPOSE 80