# --- STAGE 1: The Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# Define ARGs for build-time secrets
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Copy package configurations and source code from the flattened structure
COPY package*.json ./
COPY client/ ./client/
COPY supabase/ ./supabase/

# --- THE MAGIC FIX IS HERE ---
# Recreate the correct 'packages' structure that our package.json expects.
# This makes the build work even after Easypanel flattens the directories.
RUN mkdir packages && mv client packages/ && mv supabase packages/
# --- END FIX ---

# Now, install dependencies using the corrected structure
RUN npm install

# Copy the rest of the source code
COPY . .

# Make secrets available to the build script
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the client workspace using its proper name
RUN npm run build --workspace=@pastoragenda/client


# --- STAGE 2: The Final Nginx Production Image ---
FROM nginx:stable-alpine

# Copy the built React app from the correct nested path inside the builder
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Copy your custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80