#!/bin/bash

# Start the application in the background
npm start &

# Wait for the app to start (poll the server)
echo "Waiting for the application to start..."
until curl -s http://localhost:8080 >/dev/null; do
  sleep 1
done

echo "Application started. Launching Puppeteer script."

# Run Puppeteer script
node opaca-container/main.js
