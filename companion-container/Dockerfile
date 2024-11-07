# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY ../opaca-bpmn-editor/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY companion-container ./server

EXPOSE 8082

# Start the application
CMD ["node", "server/main.js"]
