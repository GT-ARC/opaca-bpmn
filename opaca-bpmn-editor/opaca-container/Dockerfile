# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# NOTE: call docker build from parent directory!

# Install necessary libraries for Puppeteer to run
RUN apt-get update && apt-get install -y \
    chromium \
    socat \
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


# Copy package.json and package-lock.json files
COPY package*.json ./
# Copy patches for interpreter-callbacks, so they can be applied in npm install
COPY patches ./patches

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build including stylings
RUN npm run build

#RUN groupadd -r pptruser \
#    && useradd -r -g pptruser -G audio,video pptruser \
#    && mkdir -p /usr/src/app/public \
#    && chown -R pptruser:pptruser /usr/src/app

#USER pptruser

EXPOSE 8080

EXPOSE 9222

# Start modeler and puppeteer sequentially
CMD ["opaca-container/start.sh"]
