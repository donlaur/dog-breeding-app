# Dog Breeding App - Data Model Documentation

## Overview

The Dog Breeding App uses a clear separation between different entities in its database schema. This document outlines the key tables, their relationships, and the proper patterns for accessing data.

## Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Dogs     │     │   Litters   │     │   Puppies   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │◄────┤ dam_id      │     │ id          │
│ call_name   │     │ sire_id     │◄────┤ litter_id   │
│ gender      │     │ whelp_date  │     │ name        │
│ breed_id    │     │ litter_name │     │ gender      │
│ color       │     │ num_puppies │     │ birth_date  │
│ ...         │     │ ...         │     │ color       │
└─────────────┘     └─────────────┘     │ status      │
                                        │ ...         │
                                        └─────────────┘

┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────┐
│    Customers    │     │ CustomerCommunication │     │  CustomerContract  │
├─────────────────┤     ├───────────────────────┤     ├────────────────────┤
│ id              │◄────┤ customer_id           │     │ id                 │
│ name            │     │ communication_type    │     │ customer_id        │
│ email           │     │ subject              │     │ contract_type      │
│ phone           │     │ content              │     │ start_date         │
│ lead_status     │     │ initiated_by         │     │ end_date           │
│ lead_source     │     │ follow_up_date       │     │ amount             │
│ pref_contact    │     │ notes                │     │ status             │
│ interests       │     │ created_at           │     │ terms              │
│ ...             │     │ ...                  │     │ file_path          │
└─────────────────┘     └───────────────────────┘     └────────────────────┘
```

## Key Tables and Relationships

### Dogs Table
- Stores information about adult breeding dogs (dams and sires)
- Primary identifier: `id`
- Key fields: `call_name`, `gender`, `breed_id`, `color`
- Used for: Managing breeding stock, tracking lineage

### Litters Table
- Stores information about breeding events and resulting litters
- Primary identifier: `id`
- Key fields: `dam_id`, `sire_id`, `whelp_date`, `litter_name`, `num_puppies`
- Relationships:
  - `dam_id` references `Dogs.id` (the mother)
  - `sire_id` references `Dogs.id` (the father)

### Puppies Table
- Stores information about young dogs that are part of a litter
- Primary identifier: `id`
- Key fields: `litter_id`, `name`, `gender`, `birth_date`, `color`, `status`
- Relationships:
  - `litter_id` references `Litters.id` (the litter the puppy belongs to)

### Customers Table
- Stores information about customers
- Primary identifier: `id`
- Key fields: `name`, `email`, `phone`, `lead_status`, `lead_source`
- Used for: Managing customer interactions and sales

### CustomerCommunication Table
- Stores information about customer communications
- Primary identifier: `id`
- Key fields: `customer_id`, `communication_type`, `subject`, `content`
- Relationships:
  - `customer_id` references `Customers.id` (the customer)

### CustomerContract Table
- Stores information about customer contracts
- Primary identifier: `id`
- Key fields: `customer_id`, `contract_type`, `start_date`, `end_date`, `amount`
- Relationships:
  - `customer_id` references `Customers.id` (the customer)

## Critical Distinction: Dogs vs. Puppies

**IMPORTANT**: The application maintains a clear separation between "dogs" and "puppies" in the database:

1. The "puppies" table stores information about young dogs that are part of a litter, including their litter_id association.

2. The "dogs" table is used for adult breeding dogs (dams and sires).

When querying for puppies associated with a litter, always use:
```python
db.find_by_field_values("puppies", {"litter_id": litter_id})
```

NOT:
```python
db.find_by_field_values("dogs", {"litter_id": litter_id})
```

This distinction is critical for the proper functioning of the Litter Details page and other litter-related features.

## Data Flow

1. A litter is created with references to dam and sire dogs
2. Puppies are added to the litter with a reference to the litter_id
3. When viewing litter details, the app:
   - Fetches the litter information
   - Resolves dam and sire names from their IDs
   - Retrieves all puppies associated with the litter

## Common Data Access Patterns

### Retrieving multiple records with filters
```python
# CORRECT pattern
puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})

# INCORRECT pattern - do not use
puppies = db.find("puppies", {"litter_id": litter_id})
```

### Retrieving a single record by ID
```python
# CORRECT pattern
litter = db.get("litters", litter_id)

# INCORRECT pattern - do not use
litter = db.find_by_id("litters", litter_id)
```

### Error handling pattern
```python
try:
    # Check if record exists before proceeding
    litter = db.get("litters", litter_id)
    if not litter:
        return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
    
    # Process data...
    
    # Include CORS headers in response
    response = jsonify(result)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
    
except Exception as e:
    return jsonify({"error": str(e)}), 500
```
