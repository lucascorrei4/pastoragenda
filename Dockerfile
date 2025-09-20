# --- STAGE 1: The Builder ---
    FROM node:22-alpine AS builder

    WORKDIR /app
    
    # Define ARGs for build-time secrets
    ARG VITE_SUPABASE_URL
    ARG VITE_SUPABASE_ANON_KEY
    ARG VITE_APP_URL
    ARG VITE_GOOGLE_CLIENT_ID
    ARG VITE_GOOGLE_CLIENT_SECRET
    ARG VITE_GOOGLE_REDIRECT_URI
    ARG VITE_JWT_SECRET
    
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
    ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
    ENV VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET
    ENV VITE_GOOGLE_REDIRECT_URI=$VITE_GOOGLE_REDIRECT_URI
    ENV VITE_JWT_SECRET=$VITE_JWT_SECRET
    
    # Build the client workspace
    RUN npm run build --workspace=@pastoragenda/client
    
    
    # --- STAGE 2: The Final Nginx Production Image ---
    # This is the corrected stage that builds the Nginx server.
    FROM nginx:stable-alpine
    
    # Copy the built React app from the 'builder' stage to the Nginx web root directory
    COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
    RUN echo "--- Listing contents of /usr/share/nginx/html after copying dist folder ---"
    RUN ls -la /usr/share/nginx/html
    
    # This is the key change to fix the issue.
    COPY --from=builder /app/packages/client/public /usr/share/nginx/html
    RUN echo "--- Listing contents of /usr/share/nginx/html after copying public folder ---"
    RUN ls -la /usr/share/nginx/html
    
    # Copy your custom Nginx configuration file into the container
    # This assumes your nginx config file is named "nginx.conf" in your project root
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    COPY nginx.conf /etc/nginx/sites-available/pastoragenda
    
    # Expose port 80, which is the default for Nginx
    EXPOSE 80
    