# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./
# Copy patches for interpreter-callbacks, so they can be applied in npm install
COPY patches ./patches

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 8080

# Start the application
CMD ["npm", "start"]
