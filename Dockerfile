# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Start server first
RUN node server/main.js

# Build the web application
RUN npm run build

# Start the application
# CMD ["node", "index.js"]
CMD ["node", "dist/bundle.js"]
