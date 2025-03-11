# Scripts

This directory contains various scripts used for development, deployment, and maintenance of the Breeder Management System.

## Directory Structure

- **docker/** - Scripts for managing Docker containers
  - `docker-start.sh` - Main script for starting, stopping, and managing Docker containers

- **utils/** - Utility scripts for development and maintenance
  - `restart-all.sh` - Restart all application components
  - `restart-client.sh` - Restart only the client application
  - `restart-server.sh` - Restart only the server application

- **migrations/** - Scripts for running database migrations
  - `run-documents-migration.sh` - Run document management migrations
  - `run-events-migration.sh` - Run event system migrations
  - `run-photos-migration.sh` - Run photo management migrations
  - `run-photos-rls-fix.sh` - Fix row-level security for photos
  - `run-sql.sh` - General script for running SQL commands

## Usage

### Docker Scripts

```bash
# Start in development mode
./scripts/docker/docker-start.sh dev

# Start in production mode
./scripts/docker/docker-start.sh start

# Stop all containers
./scripts/docker/docker-start.sh stop

# See all available commands
./scripts/docker/docker-start.sh help
```

### Migration Scripts

```bash
# Run the events migration
./scripts/migrations/run-events-migration.sh

# Run the photos migration
./scripts/migrations/run-photos-migration.sh

# Run SQL with a specific file
./scripts/migrations/run-sql.sh path/to/sql/file.sql
```

### Utility Scripts

```bash
# Restart all components
./scripts/utils/restart-all.sh

# Restart only the client
./scripts/utils/restart-client.sh

# Restart only the server
./scripts/utils/restart-server.sh
```