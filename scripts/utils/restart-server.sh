#!/bin/bash
echo "Restarting Python server..."
cd "$(dirname "$0")/../../"  # Navigate to project root

# Kill any existing server processes on port 5000
echo "Checking for processes on port 5000..."
lsof -i:5000 -t | xargs kill -9 2>/dev/null || echo "No processes found on port 5000"

# Start the server using the root app.py
echo "Starting server on port 5000..."
nohup python app.py > server.log 2>&1 &

echo "Python server restarted! (PID: $!)"
echo "View logs with: tail -f server.log"