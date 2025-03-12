# Dog Breeding App API Tests

This directory contains comprehensive tests for all API endpoints in the Dog Breeding App.

## Test Coverage

The tests cover the following API modules:

1. **Litters API** (`test_litters.py`)
   - Retrieval of litters
   - Retrieval of puppies for a specific litter
   - Error handling for non-existent litters

2. **Puppies API** (`test_puppies.py`)
   - Retrieval of all puppies
   - Retrieval of a specific puppy by ID
   - Retrieval of puppies by litter ID
   - Creation of new puppies
   - Updating existing puppies
   - Deletion of puppies
   - Error handling for missing fields and non-existent puppies

3. **Dogs API** (`test_dogs.py`)
   - Retrieval of all dogs
   - Retrieval of a specific dog by ID
   - Creation of new dogs
   - Updating existing dogs
   - Deletion of dogs
   - File uploads for dogs
   - Error handling for missing fields and non-existent dogs

4. **Health API** (`test_health.py`)
   - Health Records: retrieval, creation, updating, and deletion
   - Vaccinations: retrieval and creation
   - Weight Records: retrieval
   - Health Dashboard: data retrieval
   - Database query pattern verification

5. **Auth API** (`test_auth.py`)
   - User signup with validation
   - User login with credential verification
   - Profile retrieval and updating
   - Password changing
   - Token verification and protection for authenticated routes

6. **Applications API** (`test_applications.py`)
   - Form Builder: retrieval, creation, updating, and deletion of application forms
   - Form Questions: creation and management
   - Public Form Submission: form retrieval and submission
   - Form Submissions: retrieval and status updates

7. **Breeds API** (`test_breeds.py`)
   - Retrieval of all breeds
   - Retrieval of a specific breed by ID
   - Creation of new breeds
   - Updating existing breeds
   - Deletion of breeds
   - Search functionality
   - Breed characteristics retrieval
   - Database query pattern verification

## Database Query Pattern

All tests verify that the correct database query pattern is followed:
- Using `find_by_field_values(table, filters)` for retrieving multiple records with filters
- Using `get(table, id)` for retrieving single records by ID
- Proper error handling with appropriate HTTP status codes

## Running the Tests

To run all tests:

```bash
cd server
python -m pytest tests/
```

To run tests for a specific module:

```bash
cd server
python -m pytest tests/test_puppies.py
```

## Mock Database

The tests use a mock database (`MockDatabase` class in `conftest.py`) that simulates the behavior of the actual Supabase database. This allows for isolated and controlled testing of the application without requiring an actual database connection.

The mock database is pre-populated with test data for dogs, litters, and puppies to facilitate testing.

## Common Bugs and How to Avoid Them

We maintain a [Bug Database](/docs/BUG_DATABASE.md) that tracks historical issues to prevent them from recurring. Here are the most common bugs and how to avoid them:

### 1. Database Query Pattern Violations

#### Using `find()` instead of `find_by_field_values()`

**Incorrect:**
```python
db.find("dogs", {"breed": "Golden Retriever"})
```

**Correct:**
```python
db.find_by_field_values("dogs", {"breed": "Golden Retriever"})
```

#### Querying "dogs" table instead of "puppies" table for litter-related queries

**Incorrect:**
```python
db.find_by_field_values("dogs", {"litter_id": litter_id})
```

**Correct:**
```python
db.find_by_field_values("puppies", {"litter_id": litter_id})
```

#### Missing error handling after database queries

**Incorrect:**
```python
record = db.get("dogs", dog_id)
return create_response(record, 200)  # No check if record exists
```

**Correct:**
```python
record = db.get("dogs", dog_id)
if not record:
    return create_response({"error": "Dog not found"}, 404)
return create_response(record, 200)
```

### 2. Prevention Tools

We have several tools to help prevent these bugs:

1. **Pre-commit Hook**: Automatically checks for database query pattern violations before each commit
   - Install with: `./server/scripts/install_hooks.sh`

2. **Continuous Integration**: Runs tests and checks on every push

3. **Database Pattern Check Script**: Manually check for violations
   - Run with: `python server/scripts/check_db_patterns.py --dir server/api`
   - Fix automatically with: `python server/scripts/check_db_patterns.py --fix --dir server/api`

4. **PR Review Process**: Comprehensive checklist for code reviews

Refer to the [Code Review Guide](/docs/CODE_REVIEW_GUIDE.md) for more details on our quality assurance process.
