# Scripts Directory

This directory contains various scripts used for development, deployment, and maintenance of the dog breeding application.

## Directory Structure

- `deploy/`: Contains scripts used for deploying the application
  - `deploy_backend.sh`: Script for deploying the backend service
  - `deploy_frontend.sh`: Script for deploying the frontend client
  
- `migrations/`: Contains database migration scripts and utilities
  
## Usage Guidelines

### Deployment Scripts

The deployment scripts in the `deploy/` directory should be run from the project root:

```bash
# To deploy the backend
./scripts/deploy/deploy_backend.sh

# To deploy the frontend
./scripts/deploy/deploy_frontend.sh
```

### Migration Scripts

Migration scripts should be run according to the database migration documentation.

## Security Notes

- Do not commit any script containing sensitive information such as:
  - API keys
  - Database credentials
  - Personal identifiers
  - Server details
  
- Scripts that generate logs should write to the `/logs` directory, which is properly gitignored
