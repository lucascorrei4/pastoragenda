# --- STAGE 1: The Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# Define ARGs for build-time secrets (These are essential)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Copy package configurations for the flattened structure
COPY package*.json ./
COPY client/ ./client/
COPY supabase/ ./supabase/

# Install ALL dependencies for the workspaces
RUN npm install

# Copy the rest of the source code (e.g., nginx.conf, etc.)
COPY . .

# Make secrets available to the build script (These are essential)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the client workspace
RUN npm run build --workspace=client


# --- STAGE 2: The Final Nginx Production Image ---
FROM nginx:stable-alpine

# Copy the built React app from the new flattened path
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy your custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80