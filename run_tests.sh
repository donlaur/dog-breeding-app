#!/bin/bash

# Run tests for the Dog Breeding App
echo "===== Running Dog Breeding App Tests ====="

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting backend tests...${NC}"

# Install backend test dependencies if needed
if ! pip list | grep -q pytest; then
  echo "Installing backend test dependencies..."
  pip install -r server/tests/requirements.txt
fi

# Run backend tests with coverage
echo "Running backend tests..."
python -m pytest server/tests --cov=server -v

# Store backend test result
BACKEND_RESULT=$?

echo -e "${YELLOW}Starting frontend tests...${NC}"

# Navigate to client directory
cd client

# Check if Jest is installed
if ! npm list | grep -q jest; then
  echo "Installing frontend test dependencies..."
  npm install --save-dev @testing-library/react @testing-library/jest-dom jest
fi

# Run frontend tests with coverage
echo "Running frontend tests..."
npm test -- --coverage

# Store frontend test result
FRONTEND_RESULT=$?

# Go back to project root
cd ..

# Report results
echo -e "${YELLOW}===== Test Results =====${NC}"

if [ $BACKEND_RESULT -eq 0 ]; then
  echo -e "${GREEN}Backend tests: PASSED${NC}"
else
  echo -e "${RED}Backend tests: FAILED${NC}"
fi

if [ $FRONTEND_RESULT -eq 0 ]; then
  echo -e "${GREEN}Frontend tests: PASSED${NC}"
else
  echo -e "${RED}Frontend tests: FAILED${NC}"
fi

# Check if both passed
if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
