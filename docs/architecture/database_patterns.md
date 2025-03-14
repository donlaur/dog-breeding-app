# Dog Breeding App - Database Access Patterns

## Overview

This document defines the standard patterns for database access in the Dog Breeding App backend. Following these patterns consistently is **mandatory** to prevent regression bugs like the recent issue with `find_by_field_values`.

## Database Access Patterns

### Core Principles

1. **Database Initialization**: The database should be initialized in `__init__.py` and passed to route blueprints.

2. **Blueprint Creation**: All API routes should be defined using the blueprint pattern:
   ```python
   def create_<entity>_bp(db: DatabaseInterface) -> Blueprint:
       <entity>_bp = Blueprint("<entity>_bp", __name__)
       
       # Define routes here
       
       return <entity>_bp
   ```

3. **Database Function Calls**: When calling database functions, always include all required parameters:
   ```python
   # CORRECT - includes empty filters when no filtering is needed
   items = db.find_by_field_values("table_name", {})
   
   # INCORRECT - missing filters parameter
   items = db.find_by_field_values("table_name")
   ```

4. **Default Parameters**: When applicable, use default parameters to prevent errors:
   ```python
   def find_by_field_values(self, table: str, filters: Dict[str, Any] = None):
       if filters is None:
           filters = {}
   ```

## Error Handling

Always include proper error handling for database operations:

```python
try:
    item = db.get("table_name", item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    # Process item
except DatabaseError as e:
    return jsonify({"error": str(e)}), 500
```

## Testing Requirements

1. Every database pattern must have a corresponding test in `test_db_patterns.py`
2. All API endpoints must be tested for correct database usage

## Code Review Checklist

Before approving any PR, verify:

- [ ] Database functions are called with all required parameters
- [ ] Error handling is properly implemented
- [ ] Tests verify correct database usage
- [ ] No direct database queries bypass the database interface

## Future Improvements

- Consider using a dependency injection framework
- Implement proper database migrations
- Add more comprehensive property-based testing
