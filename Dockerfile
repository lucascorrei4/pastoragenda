# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install PM2 globally within the container
RUN npm install pm2 -g

# Copy the rest of your application's source code
COPY . .

# Build your React application for production
# IMPORTANT: Verify your build output is 'client'. If it's 'build', change the path in the CMD line below.
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# The command to start the app using PM2
# This tells PM2 to run the 'serve' command on the 'client' folder, listening on port 3000
CMD ["pm2-runtime", "npx", "serve", "-s", "client", "-l", "3000"]