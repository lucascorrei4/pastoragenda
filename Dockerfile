# --- STAGE 1: The Builder ---
# This stage installs everything needed to build your application
FROM node:22-alpine AS builder

WORKDIR /app

# Define ARGs for build-time secrets
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Copy package configurations
COPY package*.json ./
COPY packages/ ./packages/

# Install ALL dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of the source code
COPY . .

# Make secrets available to the build script
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the client workspace. This should now work!
RUN npm run build --workspace=@pastoragenda/client


# --- STAGE 2: The Production Image ---
# This stage creates the final, lightweight image with only what's needed to run the app
FROM node:18-alpine

WORKDIR /app

# Install only the production server dependencies
RUN npm install pm2 serve -g

# Copy the built static files from the 'builder' stage into a 'public' folder
# NOTE: Check if your build output folder is 'dist'. If it's 'build', change the source path below.
COPY --from=builder /app/packages/client/dist ./public

# Expose port 4000
EXPOSE 4000

# Start the application using PM2, serving the files from the 'public' folder
# Change this line:
CMD ["pm2-runtime", "npx", "serve", "-s", "public", "-l", "tcp://0.0.0.0:4000"]