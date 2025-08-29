# Use a stable Node.js LTS version
FROM node:22-alpine

# --- Build-time Secrets ---
# This section is CRUCIAL. It tells Docker to accept the build arguments from Easypanel.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Set the working directory
WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY packages/ ./packages/

# Install all monorepo dependencies correctly in one step
RUN npm install --omit=dev

# Copy the rest of your application source code
COPY . .

# --- Make Secrets Available to the Build Script ---
# This makes the secrets available as environment variables for the build command
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the specific client workspace
RUN npm run build --workspace=@pastoragenda/client

# Install PM2 and serve globally for the final stage
RUN npm install pm2 serve -g

# Expose port 4000
EXPOSE 4000

# Start the application using PM2 on port 4000
# NOTE: Check if your build output folder is 'dist'. If it's 'build', change the path below.
CMD ["pm2-runtime", "npx", "serve", "-s", "packages/client/dist", "-l", "4000"]