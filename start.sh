#!/bin/bash

# start.sh - Convenience launcher script for the Dog Breeding App
# This script forwards commands to the appropriate scripts in the scripts directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# Function to show help
show_help() {
  echo "Breeder Management System Launcher"
  echo ""
  echo "Usage: ./start.sh [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  docker:start       Start Docker containers in production mode"
  echo "  docker:dev         Start Docker containers in development mode with hot reload"
  echo "  docker:stop        Stop all Docker containers"
  echo "  docker:logs        Show Docker container logs"
  echo "  docker:build       Build Docker containers"
  echo "  client:dev         Start client in development mode with port conflict resolution"
  echo "  client:test        Run client tests with isolated ports"
  echo "  server             Start the Flask server directly"
  echo "  migrate            Run all database migrations"
  echo "  help               Show this help message"
  echo ""
  echo "For more detailed information, see the documentation in docs/"
}

# Process command line arguments
case "$1" in
  docker:start)
    echo "Starting Docker containers in production mode..."
    $SCRIPT_DIR/scripts/docker/docker-start.sh start
    ;;
  docker:dev)
    echo "Starting Docker containers in development mode..."
    $SCRIPT_DIR/scripts/docker/docker-start.sh dev
    ;;
  docker:stop)
    echo "Stopping Docker containers..."
    $SCRIPT_DIR/scripts/docker/docker-start.sh stop
    ;;
  docker:logs)
    echo "Showing Docker logs..."
    $SCRIPT_DIR/scripts/docker/docker-start.sh logs
    ;;
  docker:build)
    echo "Building Docker containers..."
    $SCRIPT_DIR/scripts/docker/docker-start.sh build
    ;;
  client:dev)
    echo "Starting client in development mode..."
    cd $SCRIPT_DIR/client && npm run dev
    ;;
  client:test)
    echo "Running client tests with isolated ports..."
    cd $SCRIPT_DIR/client && npm run test:isolated
    ;;
  migrate)
    echo "Running database migrations..."
    python3 $SCRIPT_DIR/database/scripts/run_migrations.py
    ;;
  server)
    echo "Starting server..."
    cd $SCRIPT_DIR && python3 app.py
    ;;
  help|*)
    show_help
    ;;
esac

exit 0