# Docker Setup for Dog Breeding Application

This document provides instructions for setting up and running the application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git (to clone the repository)

## Setup Instructions

1. **Make the helper script executable**:

```bash
chmod +x docker-start.sh
```

2. **Create your environment file**:

Copy the example environment file and edit it with your actual values:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual Supabase credentials and other configuration.

3. **Build the Docker containers**:

```bash
./docker-start.sh build
```

4. **Start the application**:

```bash
./docker-start.sh start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Available Commands

The `docker-start.sh` script provides several helpful commands:

- `./docker-start.sh start` - Start the containers
- `./docker-start.sh stop` - Stop the containers
- `./docker-start.sh restart` - Restart the containers
- `./docker-start.sh build` - Build or rebuild the containers
- `./docker-start.sh logs` - Show container logs
- `./docker-start.sh clean` - Remove all containers, images, and volumes
- `./docker-start.sh help` - Show help information

## Development Workflow

When developing with Docker:

1. Changes to the React code will automatically reflect in the browser (hot-reloading)
2. Changes to the Flask backend code may require restarting the container:
   ```bash
   ./docker-start.sh restart
   ```

## Database Initialization and Migrations

If you're using a local PostgreSQL database (as configured in docker-compose.yml):

1. **Initial Database Setup**:
   After starting the containers for the first time, you need to initialize the database:

   ```bash
   # Run migrations
   docker-compose exec api flask db upgrade
   
   # Optionally, seed the database with initial data
   docker-compose exec api flask seed
   ```

2. **Creating New Migrations**:
   When you modify your database models, create new migrations:

   ```bash
   docker-compose exec api flask db migrate -m "Description of changes"
   docker-compose exec api flask db upgrade
   ```

Note: If you're using Supabase exclusively, you can ignore these migration steps.

## Troubleshooting

If you encounter any issues:

1. Check the logs: `./docker-start.sh logs`
2. Make sure your `.env` file contains the correct credentials
3. Try rebuilding the containers: `./docker-start.sh build`
4. Ensure ports 3000 and 5000 are not in use by other applications
5. For database-related issues, you can check the database logs:
   ```bash
   docker-compose logs db
   ```

## Production Deployment

For production deployment:

1. Modify the `docker-compose.yml` file to set `FLASK_DEBUG=0`
2. Consider using a production-grade database setup
3. Set up proper HTTPS with a reverse proxy like Nginx
4. Use Docker volumes for persistent data 