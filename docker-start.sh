#!/bin/bash

# Check if .env file exists, if not create one from example
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Creating .env file from .env.example"
    cp .env.example .env
    echo "Please edit the .env file with your actual configuration values before continuing."
    exit 1
  else
    echo "No .env or .env.example file found. Please create a .env file with necessary environment variables."
    exit 1
  fi
fi

# Function to show help
show_help() {
  echo "Usage: ./docker-start.sh [OPTION]"
  echo "Control Docker environment for the dog breeding application"
  echo ""
  echo "Options:"
  echo "  start       Start the Docker containers in production mode"
  echo "  dev         Start the Docker containers in development mode with hot reload"
  echo "  stop        Stop the Docker containers"
  echo "  restart     Restart the Docker containers"
  echo "  build       Build or rebuild the Docker containers"
  echo "  build:dev   Build or rebuild the development Docker containers"
  echo "  logs        Show the logs from the containers"
  echo "  clean       Remove containers, images, and volumes (CAUTION: Data will be lost)"
  echo "  help        Show this help message"
}

# Process command line arguments
case "$1" in
  start)
    echo "Starting Docker containers in production mode..."
    docker-compose up -d
    echo "Started! The application is now running at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000/api"
    ;;
  dev)
    echo "Starting Docker containers in development mode with hot reload..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "Started in DEV mode! The application is now running at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000/api"
    echo "Changes to your code will automatically reload."
    ;;
  stop)
    echo "Stopping Docker containers..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    ;;
  restart)
    echo "Restarting Docker containers..."
    if [ "$2" == "dev" ]; then
      docker-compose -f docker-compose.dev.yml down
      docker-compose -f docker-compose.dev.yml up -d
      echo "Restarted in DEV mode!"
    else
      docker-compose down
      docker-compose up -d
      echo "Restarted in PRODUCTION mode!"
    fi
    ;;
  build)
    echo "Building Docker containers..."
    docker-compose build
    ;;
  "build:dev")
    echo "Building development Docker containers..."
    docker-compose -f docker-compose.dev.yml build
    ;;
  logs)
    echo "Showing logs..."
    if [ "$2" == "dev" ]; then
      docker-compose -f docker-compose.dev.yml logs -f
    else
      docker-compose logs -f
    fi
    ;;
  clean)
    echo "WARNING: This will remove all containers, images, and volumes for this project."
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v --rmi all --remove-orphans
      docker-compose -f docker-compose.dev.yml down -v --rmi all --remove-orphans
      echo "Clean-up complete."
    fi
    ;;
  help|*)
    show_help
    ;;
esac

exit 0