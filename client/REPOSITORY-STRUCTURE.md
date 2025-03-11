# Repository Structure

This document describes the organization of the Breeder Management System repository.

## Directory Structure

```
breeder-tools/dog-breeding-app/
├── app.py                      # Main Flask application entry point
├── client/                     # Frontend React application
│   ├── src/                    # React source code
│   ├── public/                 # Static assets
│   └── package.json            # NPM dependencies
├── server/                     # Backend Flask application
│   ├── app.py                  # Server implementation
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── tests/                  # Server tests
│   ├── utils/                  # Utility functions
│   ├── config/                 # Server configuration
│   └── requirements.txt        # Python dependencies
├── config/                     # Configuration templates and examples
│   ├── email-config-template.env  # Email configuration template
│   └── logging.config.example.js  # Logging configuration example
├── database/                   # Database-related files and migrations
│   ├── migrations/             # Database migration files
│   │   ├── versions/           # Alembic migrations
│   │   └── supabase/           # Supabase-specific migrations
│   └── scripts/                # Database management scripts
├── docker/                     # Docker configuration files
│   ├── docker-compose.yml      # Production Docker Compose configuration
│   └── docker-compose.dev.yml  # Development Docker Compose configuration
├── docs/                       # Documentation
├── logs/                       # Application logs (not committed to git)
├── scripts/                    # Utility scripts
│   ├── docker/                 # Docker-related scripts
│   │   └── docker-start.sh     # Docker management script
│   ├── migrations/             # Migration runner scripts
│   └── utils/                  # Utility scripts
├── .env.example                # Example environment variables
├── README.md                   # Main project documentation
└── start.sh                    # Convenience launcher script
```

## Key Components

### Client Application

The frontend React application is in the `client/` directory. Key files and directories include:

- `src/` - Application source code
- `public/` - Static assets
- `package.json` - NPM dependencies

### Server Application

The backend Flask application is in the `server/` directory. Key files and directories include:

- `server/` - Server code and API endpoints
- `models/` - Database models
- `app.py` - Application entry point

### Configuration

Configuration files are organized in the `config/` directory:

- `email-config-template.env` - Template for email configuration
- `logging.config.example.js` - Example logging configuration

### Database

Database-related files are in the `database/` directory:

- `migrations/` - Database migrations
- `scripts/` - Database management scripts

### Docker

Docker configuration files are in the `docker/` directory:

- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration

### Scripts

Utility scripts are organized in the `scripts/` directory:

- `docker/` - Docker-related scripts
- `migrations/` - Database migration scripts
- `utils/` - Utility scripts

## Script Usage

### Docker Scripts

```bash
# Start the application in development mode
./start.sh docker:dev

# Start the application in production mode
./start.sh docker:start

# View logs
./start.sh docker:logs

# Run client in development mode
./start.sh client:dev

# Run server directly
./start.sh server
```

### Migration Scripts

```bash
# Run all database migrations
./start.sh migrate

# Run specific migrations
./scripts/migrations/run-events-migration.sh
./scripts/migrations/run-documents-migration.sh
```

## Log Files

Application logs are stored in the `logs/` directory. These files are not committed to git. To view logs:

```bash
# View logs directly
cat logs/server.log

# View Docker logs
./start.sh docker:logs
```