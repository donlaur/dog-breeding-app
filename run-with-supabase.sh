#!/bin/bash

# Script to run the Dog Breeding App with Supabase cloud database
# This script provides a simplified MCP setup without Docker

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Dog Breeding App - Supabase Connection Setup${NC}"
echo "This script will help you run your local development environment"
echo "while connecting to your cloud Supabase database."
echo

# Check if the .env file exists in the project root
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found in the project root.${NC}"
  exit 1
fi

# Source the environment variables from .env
export $(grep -v '^#' .env | xargs)

# Check if Supabase environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_URL and/or SUPABASE_KEY not found in .env file.${NC}"
  exit 1
fi

echo -e "${GREEN}Supabase environment variables loaded successfully.${NC}"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "ADMIN_EMAILS: $ADMIN_EMAILS"
echo

# Set additional environment variables for the server
export USE_CLOUD_DB=true
export FLASK_APP=app.py
export FLASK_DEBUG=1
export FLASK_ENV=development
export PYTHONUNBUFFERED=1
export FLASK_RUN_PORT=5000

# Check if port 5000 is in use and kill the process if needed
PORT_CHECK=$(lsof -i :5000 | grep LISTEN)
if [ ! -z "$PORT_CHECK" ]; then
  echo -e "${YELLOW}Port 5000 is in use. Attempting to free it...${NC}"
  PID=$(echo "$PORT_CHECK" | awk '{print $2}')
  echo -e "Killing process $PID using port 5000..."
  kill -9 $PID
  sleep 1
  echo -e "${GREEN}Port 5000 is now available.${NC}"
fi

# Create uploads directory if it doesn't exist
mkdir -p server/uploads
chmod 777 server/uploads

echo -e "${YELLOW}Starting the server...${NC}"
echo "The server will use the following database patterns:"
echo "- find_by_field_values() for filtering records"
echo "- get() for retrieving single records"
echo "- Proper separation between puppies and dogs tables"
echo "- Proper error handling for all database operations"
echo

# Start the Flask server in the background
cd server && python -m flask run --host=0.0.0.0 &
SERVER_PID=$!

# Wait for the server to start
echo -e "${YELLOW}Waiting for the server to start...${NC}"
sleep 5

# Check if the server is running
if kill -0 $SERVER_PID 2>/dev/null; then
  echo -e "${GREEN}Server started successfully with PID: $SERVER_PID${NC}"
else
  echo -e "${RED}Server failed to start.${NC}"
  exit 1
fi

echo -e "${YELLOW}Starting the client...${NC}"
# Start the React client in a new terminal
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/../client && npm start"'

echo -e "${GREEN}MCP environment is now running!${NC}"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo
echo -e "${YELLOW}To stop the server:${NC} kill $SERVER_PID"

# Keep the script running to maintain the server process
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
wait $SERVER_PID
