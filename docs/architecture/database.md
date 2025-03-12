# Dog Breeding App Database Architecture

## Overview

The Dog Breeding App uses **Supabase** as its primary database solution. This document outlines the database structure, models, and implementation patterns used throughout the application.

## Database Technology

- **Primary Database**: Supabase (PostgreSQL-based)
- **ORM/Query Layer**: Direct Supabase client API calls (No SQLAlchemy)

## Database Access Pattern

All database interactions follow this pattern:

```python
from server.supabase_client import supabase

# Example model method
@staticmethod
def get_all():
    response = supabase.table("table_name").select("*").execute()
    return response.data
```

## Important Notes

1. We DO NOT use SQLAlchemy in this project
2. All models use static methods that return data directly from Supabase
3. Models do not maintain state - they are purely functional interfaces to the database
4. Database responses are typically in the format: `response.data`

## Common Supabase Operations

- **Select**: `supabase.table("table_name").select("*").execute()`
- **Filter**: `supabase.table("table_name").select("*").eq("column", value).execute()`
- **Order**: `supabase.table("table_name").select("*").order("column", desc=True).execute()`
- **Insert**: `supabase.table("table_name").insert(data_dict).execute()`
- **Update**: `supabase.table("table_name").update(data_dict).eq("id", item_id).execute()`
- **Delete**: `supabase.table("table_name").delete().eq("id", item_id).execute()`

## Database Tables

The application uses the following main tables:

- users
- dogs
- litters
- puppies
- health_records
- vaccinations
- medications
- notifications
- customers
- applications
- breeding_programs
- dog_breeds

## Model Implementation Pattern

All models follow this implementation pattern:

```python
class ModelName:
    @staticmethod
    def get_all():
        response = supabase.table("table_name").select("*").execute()
        return response.data
        
    @staticmethod
    def get_by_id(id):
        response = supabase.table("table_name").select("*").eq("id", id).execute()
        return response.data[0] if response.data else None
        
    @staticmethod
    def create(data):
        response = supabase.table("table_name").insert(data).execute()
        return response.data[0] if response.data else None
        
    @staticmethod
    def update(id, data):
        response = supabase.table("table_name").update(data).eq("id", id).execute()
        return response.data[0] if response.data else None
        
    @staticmethod
    def delete(id):
        response = supabase.table("table_name").delete().eq("id", id).execute()
        return response.data
```
