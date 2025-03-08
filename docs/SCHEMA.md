# Database Schema Reference

## Important Field Mappings

### Dogs Table
- `id` - Primary key
- `call_name` (NOT `name`) - The dog's primary name
- `registered_name` - Official registration name
- `breed_id` - Foreign key to breeds table
- `gender` - Dog's gender
- `color` - Dog's color
- `birth_date` - Date of birth
- `cover_photo` (NOT `photo_url`) - URL to dog's main photo
- `status` - Current status (Active, Retired, etc)
- `description` - General description
- `notes` - Additional notes
- `markings` - Distinctive markings
- `microchip` - Microchip number
- `registration_type` - Type of registration
- `program_id` - Foreign key to programs
- `litter_id` - Foreign key to litters table (for puppies)
- `created_at` - Timestamp of creation (auto-set)
- `updated_at` - Timestamp of last update (auto-updated)

### Litters Table
- `id` - Primary key
- `litter_name` - Name of the litter
- `whelp_date` (NOT `birth_date`) - Date puppies were born
- `expected_date` - Expected birth date for planned litters
- `num_puppies` (NOT `puppy_count` or `expected_size`) - Number of puppies in litter
- `dam_id` - Foreign key to dogs table for mother
- `sire_id` - Foreign key to dogs table for father
- `cover_photo` - URL to litter's main photo
- `price` - Price for puppies in this litter
- `deposit` - Required deposit amount
- `status` - Current status of litter (Born, Expected, etc.)
- `created_at` - Timestamp of creation (auto-set)
- `updated_at` - Timestamp of last update (auto-updated)

### Puppies Table
- `id` - Primary key
- `name` - Puppy's name
- `litter_id` - Foreign key to litters table
- `gender` - Puppy's gender
- `color` - Puppy's color
- `status` - Current status
- `birth_date` - Date of birth
- `cover_photo` - URL to puppy's main photo
- `created_at` - Timestamp of creation (auto-set)
- `updated_at` - Timestamp of last update (auto-updated)

## Field Verification Guidelines

1. Before adding fields to queries:
   - Verify field exists in database schema
   - Check for renamed fields (e.g., `call_name` vs `name`)
   - Test queries with minimal fields first

2. When updating endpoints:
   - Keep list of verified fields in this document
   - Update all related endpoints together
   - Test all affected pages after changes

3. Common Field Mistakes:
   - Using `name` instead of `call_name`
   - Using `photo_url` instead of `cover_photo`
   - Using `whelp_date` instead of `birth_date`
   - Using non-existent status fields

## Common Gotchas

1. Parent Information in Litters
   - Always use `call_name` when querying dog names
   - Parent photos are stored in `cover_photo`
   - Parent ages should be calculated from `birth_date`

2. API Response Structure
   - Use `response.data` for Supabase responses
   - Don't check for `response.error`
   - Always handle CORS headers in responses

3. Database Interface
   - Use `db.supabase` for queries (defined in `init.py`)
   - Avoid direct database access
   - Use proper error handling with try/catch blocks

4. Field Type Handling
   - Convert empty strings to `None` for numeric fields
   - Handle `null` values in responses
   - Use proper date formatting for all date fields

## Example Queries

### Fetching Litter with Parent Details
```python
response = db.supabase.table("litters").select(
    "id",
    "litter_name",
    "status",
    "birth_date",
    "expected_date",
    "num_puppies",
    "dam_id",
    "sire_id",
    "cover_photo",
    "created_at",
    "updated_at",
    "price",
    "deposit"
).execute()
```

### Fetching Dog Details
```python
response = db.supabase.table("dogs").select(
    "id",
    "call_name",
    "cover_photo",
    "birth_date"
).execute()
```

## Frontend Component Field References

### LitterCard Component
```javascript
litter.birth_date    // Date of birth
litter.expected_date // Expected date
litter.num_puppies   // Number of puppies
litter.dam_name      // Dam's call_name
litter.sire_name     // Sire's call_name
litter.cover_photo   // Litter photo URL
```

### DogContext Usage
```javascript
const { dogs, litters, puppies } = useDog();
// Always check for null/undefined before accessing properties
const dogName = dog?.call_name || 'Unknown';
const dogPhoto = dog?.cover_photo;
``` 