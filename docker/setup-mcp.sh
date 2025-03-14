#!/bin/bash

# Script to set up and run the Multi-Cloud Platform for Dog Breeding App
# This script helps connect your local Docker environment to the cloud Supabase database

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Dog Breeding App - MCP Setup${NC}"
echo "This script will help you set up your local development environment"
echo "with Docker while connecting to your cloud Supabase database."
echo

# Check if .env file exists
if [ ! -f ../.env ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  
  # Prompt for Supabase credentials
  echo -e "${YELLOW}Please enter your Supabase URL:${NC}"
  read supabase_url
  
  echo -e "${YELLOW}Please enter your Supabase Key:${NC}"
  read supabase_key
  
  echo -e "${YELLOW}Please enter admin email(s) separated by commas:${NC}"
  read admin_emails
  
  # Create .env file
  cat > ../.env << EOF
SUPABASE_URL=${supabase_url}
SUPABASE_KEY=${supabase_key}
ADMIN_EMAILS=${admin_emails}
EOF
  
  echo -e "${GREEN}Created .env file successfully!${NC}"
else
  echo -e "${GREEN}.env file already exists.${NC}"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Start the Docker environment
echo -e "${GREEN}Starting Docker environment...${NC}"
echo "This will connect to your cloud Supabase database."
echo "Your local server will use the database patterns you've established:"
echo "- find_by_field_values() for filtering records"
echo "- get() for retrieving single records"
echo "- Proper error handling for all database operations"
echo

docker-compose -f docker-compose.dev.yml up -d

echo -e "${GREEN}MCP environment is now running!${NC}"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo "- API Documentation: http://localhost:8080"
echo
echo -e "${YELLOW}To view logs:${NC} docker-compose -f docker-compose.dev.yml logs -f"
echo -e "${YELLOW}To stop:${NC} docker-compose -f docker-compose.dev.yml down"
