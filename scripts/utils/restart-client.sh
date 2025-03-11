#!/bin/bash
echo "Restarting React client..."
cd "$(dirname "$0")/client"

# Kill any existing React processes
pkill -f "node.*react-scripts" || echo "No React processes to kill"

# Start the client
nohup npm start > client.log 2>&1 &

echo "React client restarted! (PID: $!)"
echo "View logs with: tail -f client/client.log"