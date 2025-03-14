# Dog Breeding App - Docker MCP Setup

This guide explains how to set up and run the Dog Breeding App using Docker with a Multi-Cloud Platform (MCP) approach, connecting your local development environment to your Supabase cloud database.

## What is MCP?

MCP (Multi-Cloud Platform) is an approach that allows you to run your application locally while connecting to cloud services. For the Dog Breeding App, this means:

1. Running the frontend and backend containers locally using Docker
2. Connecting to your Supabase cloud database for data storage
3. Maintaining consistent database access patterns across environments

## Prerequisites

- Docker and Docker Compose installed on your machine
- Supabase account with a project set up
- Supabase URL and API Key

## Quick Start

The easiest way to get started is to use the setup script:

```bash
# Navigate to the docker directory
cd docker

# Make the script executable (if not already)
chmod +x setup-mcp.sh

# Run the setup script
./setup-mcp.sh
```

The script will:
1. Prompt for your Supabase URL, key, and admin emails
2. Create a .env file with these credentials
3. Start the Docker containers with the proper configuration

## Manual Setup

If you prefer to set up manually:

1. Create a `.env` file in the project root with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ADMIN_EMAILS=admin@example.com
   ```

2. Start the Docker environment:
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Accessing the Application

Once running, you can access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:8080

## Database Access Patterns

The Dog Breeding App follows specific patterns for database queries:

1. For retrieving multiple records with filters:
   - Use `find_by_field_values(table, filters)` method
   - Example: `db.find_by_field_values("dogs", {"litter_id": litter_id})`

2. For retrieving a single record by ID:
   - Use `get(table, id)` method
   - Example: `db.get("litters", litter_id)`

3. Error handling pattern:
   - Always check if the record exists before proceeding
   - Return appropriate HTTP status codes (404 for not found, 500 for server errors)

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your Supabase URL and key are correct in the .env file
2. Check that your Supabase project is running and accessible
3. Ensure your IP address is allowed in Supabase's security settings

### Docker Issues

If you encounter Docker-related issues:

1. Check if Docker is running: `docker info`
2. View container logs: `docker-compose -f docker-compose.dev.yml logs -f`
3. Restart containers: `docker-compose -f docker-compose.dev.yml restart`

## Stopping the Environment

To stop the Docker environment:

```bash
cd docker
docker-compose -f docker-compose.dev.yml down
```
