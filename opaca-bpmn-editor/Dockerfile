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

# Install necessary libraries for Puppeteer to run
RUN apt-get update && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Build including stylings
RUN npm run build

EXPOSE 8080

# Start the application
#CMD ["npm", "start"]

#RUN npm start
#CMD ["node", "puppeteer/main.js"]

CMD ["./start.sh"]
