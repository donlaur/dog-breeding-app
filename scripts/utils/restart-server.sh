#!/bin/bash
echo "Restarting Python server..."
cd "$(dirname "$0")"

# Kill any existing server processes
pkill -f "python.*server.app" || echo "No server processes to kill"

# Activate the virtual environment and start the server
source venv/bin/activate
nohup python -m server.app > server.log 2>&1 &

echo "Python server restarted! (PID: $!)"
echo "View logs with: tail -f server.log"