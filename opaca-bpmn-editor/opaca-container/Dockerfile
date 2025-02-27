# Use the official Puppeteer image as the base
FROM ghcr.io/puppeteer/puppeteer:19.2.0

# Set the working directory
WORKDIR /usr/src/app

# Copy application files
COPY ../package*.json ./

# Ensure non-root user has ownership
USER root
RUN chown -R pptruser:pptruser /usr/src/app

# Switch to non-root user
USER pptruser

# Install dependencies
RUN npm install

COPY . .

# Ensure writable permissions for public and other required directories
USER root
RUN mkdir -p /usr/src/app/public && \
    chown -R pptruser:pptruser /usr/src/app

USER pptruser
# Build the application
RUN npm run build

# Expose required ports
EXPOSE 8080 9222

# Start the application
ENTRYPOINT ["sh", "opaca-container/start.sh"]
