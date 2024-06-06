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

# Build the web application
RUN npm run build

# Start server
node server/main.js

# Start the application
# CMD ["node", "index.js"]
CMD ["node", "dist/bundle.js"]
