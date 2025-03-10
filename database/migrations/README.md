# Database Migrations

This directory contains SQL migration files that define the database schema for the Dog Breeding Application.

## Migration Files

Migrations are ordered by file prefix numbers and should be applied sequentially:

1. `001_initial_schema.sql` - Initial schema with core tables
2. `002_lead_management.sql` - Lead management system tables
3. `003_messaging_system.sql` - Messaging system for communication
4. `004_health_management.sql` - Health record management system

## How to Apply Migrations

### Development Environment

In your development environment, you can apply these migrations to your Supabase project through:

1. The Supabase Dashboard SQL Editor
2. Copy and paste each migration file in sequence
3. Execute the SQL statements

### Production Deployment

For production deployments, we recommend:

1. Creating a backup of your database before applying migrations
2. Testing migrations in a staging environment first
3. Applying migrations during scheduled maintenance windows

## Table Structure

The migrations implement the following database structure:

- **customers** - Customer information
- **leads** - Potential customer leads and their conversion process
- **messages** - Communication between breeders and leads/customers
- **health_records** - General health records for dogs and puppies
- **vaccinations** - Vaccination records for dogs and puppies
- **medications** - Medication records and dosage tracking
- **weight_records** - Weight tracking for dogs and puppies
- **health_conditions** - Health conditions and diagnoses
- **health_condition_templates** - Templates for common health conditions

## Security

All tables have Row Level Security (RLS) enabled to ensure that users can only access their own data.

## Indexes

Appropriate indexes have been created for all tables to ensure optimal query performance, particularly for filtered queries and foreign key relationships.

## Adding New Migrations

When creating new migrations:

1. Number them sequentially (e.g., `005_feature_name.sql`)
2. Include comments explaining the purpose of the migration
3. Use `CREATE TABLE IF NOT EXISTS` to avoid errors if the table already exists
4. Include proper RLS policies for security
5. Add appropriate indexes for performance
6. Document the changes in this README file
