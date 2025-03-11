#!/bin/bash
echo "Restarting React client..."
cd "$(dirname "$0")/../../client"  # Navigate to client directory from scripts/utils

# Kill any existing React processes on port 3000
echo "Checking for processes on port 3000..."
lsof -i:3000 -t | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Start the client
echo "Starting client on port 3000..."
nohup npm start > client.log 2>&1 &

echo "React client restarted! (PID: $!)"
echo "View logs with: tail -f client.log"