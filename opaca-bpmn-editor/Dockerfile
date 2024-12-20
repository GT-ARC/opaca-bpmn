# Use official Node runtime as the base
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy application files
COPY package*.json ./
COPY patches ./patches

# Install dependencies
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Expose required port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
