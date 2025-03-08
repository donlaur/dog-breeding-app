#\!/bin/bash

# Get the SQL file to run
SQL_FILE=cms_data.sql

# Check if the file exists
if [ \! -f "$SQL_FILE" ]; then
    echo "Error: SQL file $SQL_FILE not found"
    exit 1
fi

# Find the docker-compose file and use it to connect to the postgres container
DOCKER_COMPOSE_FILE="docker-compose.dev.yml"

if [ \! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Error: Docker Compose file $DOCKER_COMPOSE_FILE not found"
    exit 1
fi

# Get the postgres container name
POSTGRES_CONTAINER=$(docker-compose -f $DOCKER_COMPOSE_FILE ps -q postgres)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "Error: Postgres container not found or not running"
    exit 1
fi

# Run the SQL script inside the container
echo "Running SQL script in Postgres container..."
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d breeder_tools -f - < $SQL_FILE

echo "SQL script execution completed"
