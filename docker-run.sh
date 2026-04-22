#!/bin/bash

# Build and run the Docker container
echo "Building Docker image..."
docker build -t demo1-app .

echo "Getting host IP address..."
# For Windows/WSL
HOST_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ipconfig | grep "IPv4 Address" | head -1 | awk -F: '{print $2}' | xargs)

if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
fi

echo "Host IP: $HOST_IP"

echo "Running Docker container..."
docker run -d \
  --name demo1-container \
  -p 3000:3000 \
  --env-file .env.production \
  -e NEXTAUTH_URL=http://$HOST_IP:3000 \
  demo1-app

echo "Application is running on http://$HOST_IP:3000"
echo "Container name: demo1-container"
echo ""
echo "To stop the container, run: docker stop demo1-container"
echo "To remove the container, run: docker rm demo1-container"