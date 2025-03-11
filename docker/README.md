# Docker Configuration

This directory contains Docker configuration files for the Breeder Management System.

## Files

- **docker-compose.yml** - Production Docker Compose configuration
- **docker-compose.dev.yml** - Development Docker Compose configuration with hot reloading
- **Dockerfile** - Main Dockerfile for the application

## Client Docker Files

The client directory contains additional Docker files:
- **client/Dockerfile** - Production build for the React frontend
- **client/Dockerfile.dev** - Development configuration with hot reloading

## Server Docker Files

The server directory contains additional Docker files:
- **server/Dockerfile** - Production build for the Flask backend
- **server/Dockerfile.dev** - Development configuration with hot reloading

## Using Docker

The application includes a helper script to manage Docker containers. Use the following commands:

```bash
# Start in development mode
./scripts/docker/docker-start.sh dev

# Start in production mode
./scripts/docker/docker-start.sh start

# Stop all containers
./scripts/docker/docker-start.sh stop

# Rebuild containers
./scripts/docker/docker-start.sh build  # Production
./scripts/docker/docker-start.sh build:dev  # Development

# Show container logs
./scripts/docker/docker-start.sh logs

# Clean up Docker resources
./scripts/docker/docker-start.sh clean
```

## Docker Compose Services

The Docker Compose configuration includes the following services:

### Production (`docker-compose.yml`)

- **db** - PostgreSQL database
- **api** - Flask backend API
- **client** - React frontend (served via Nginx)

### Development (`docker-compose.dev.yml`)

- **api** - Flask backend API with hot reloading
- **client** - React frontend with hot reloading

## Port Configuration

- Frontend: 3000 (dev), 80/3000 (production)
- Backend API: 5000
- Database: 5432

These ports can be configured through environment variables in the `.env` file.