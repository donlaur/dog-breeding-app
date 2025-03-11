# Database

This directory contains all database-related files, migrations, and scripts for the Breeder Management System.

## Directory Structure

- **migrations/** - Database migration files
  - Supabase migrations
  - Alembic migrations
  - SQL scripts

- **scripts/** - Database management scripts
  - `run_migrations.py` - Python script to run migrations
  - `generate_all_events.py` - Script to generate events for existing data

## Migrations

The application uses several types of migrations:

1. **Supabase Migrations** - Used for Supabase-specific features
2. **Alembic Migrations** - Used with SQLAlchemy for schema changes
3. **Manual SQL Scripts** - Direct SQL changes for complex operations

### Running Migrations

To run migrations, use the scripts in the `/scripts/migrations/` directory:

```bash
# Run a specific migration
./scripts/migrations/run-documents-migration.sh
./scripts/migrations/run-events-migration.sh

# Or use the Python migration tool
python database/scripts/run_migrations.py
```

## Database Schema

The main database entities include:

- Users
- Dogs
- Puppies
- Litters
- Heat Cycles
- Events
- Health Records

Refer to the [database schema documentation](../docs/database-schema.md) for more details.

## Supabase Integration

The application uses Supabase for database storage and authentication. Configuration is managed through environment variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```