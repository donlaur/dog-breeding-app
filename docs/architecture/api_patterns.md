# Dog Breeding App - API Patterns Documentation

## Overview

The Dog Breeding App follows specific patterns for API communication between frontend and backend. This document outlines these patterns to ensure consistency and prevent regression bugs.

## API URL Configuration

The API base URL is defined in `src/config.js` as '/api' and must be imported in any file that makes API calls:

```javascript
import { API_URL, debugLog, debugError } from '../config';
```

## Frontend API Communication Pattern

### Core Principles

1. **NEVER use direct fetch calls**. Always use the utility functions from `apiUtils.js`:
   - `apiGet(endpoint)`
   - `apiPost(endpoint, data)`
   - `apiPut(endpoint, data)`
   - `apiDelete(endpoint)`

2. These utility functions handle:
   - Authentication headers
   - Proper URL formatting
   - Consistent error handling
   - Response parsing

3. For specific entities, use the dedicated functions:
   - `getLitter(id)` - Get a specific litter
   - `getLitterPuppies(litterId)` - Get puppies for a specific litter
   - `getDog(id)` - Get a specific dog
   - etc.

### Example Usage

```javascript
// CORRECT pattern - import specific functions
import { getLitter, getLitterPuppies } from '../../utils/apiUtils';

// Use in async functions
async function fetchLitterDetails(id) {
  // Fetch litter details
  const response = await getLitter(id);
  
  if (response.ok) {
    // Success case
    setLitter(response.data);
    
    // Fetch puppies for this litter
    const puppiesResponse = await getLitterPuppies(id);
    if (puppiesResponse.ok) {
      setPuppies(puppiesResponse.data);
    } else {
      setError(puppiesResponse.error);
    }
  } else {
    // Error case
    setError(response.error);
  }
}
```

### INCORRECT Patterns to Avoid

```javascript
// INCORRECT - direct fetch call
fetch('/api/litters/3')
  .then(res => res.json())
  .then(data => setLitter(data));

// INCORRECT - not using dedicated functions
import { apiGet } from '../../utils/apiUtils';
apiGet(`litters/${id}`).then(response => {
  if (response.ok) {
    setLitter(response.data);
  }
});
```

## Backend API Patterns

### Route Structure

Routes follow a RESTful pattern:

- GET `/api/[resource]` - List all resources
- GET `/api/[resource]/:id` - Get a specific resource
- POST `/api/[resource]` - Create a new resource
- PUT `/api/[resource]/:id` - Update a specific resource
- DELETE `/api/[resource]/:id` - Delete a specific resource

Special routes follow the pattern:
- GET `/api/[resource]/:id/[related-resource]` - Get related resources

### Blueprint Registration

All routes are registered through blueprints:

```python
def create_litters_bp(db):
    """Create and return the litters blueprint with the provided database instance"""
    
    @litters_bp.route("/<int:litter_id>/puppies", methods=["GET"])
    def get_litter_puppies(litter_id):
        # Implementation...
        
    return litters_bp
```

### Database Query Pattern

1. For retrieving multiple records with filters:
   ```python
   # CORRECT pattern
   puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})
   ```

2. For retrieving a single record by ID:
   ```python
   # CORRECT pattern
   litter = db.get("litters", litter_id)
   ```

3. Error handling pattern:
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

## Port Configuration

- Server always runs on port 5000
- Client always runs on port 3000

## Authentication

Secured endpoints use the `@login_required` decorator to ensure authentication:

```python
@litters_bp.route("/", methods=["POST"])
@login_required
def create_litter():
    # Implementation...
```

## Response Format

All API responses follow a consistent format:

```javascript
// Success response
{
  "data": [...], // or {...} for single item
  "ok": true
}

// Error response
{
  "error": "Error message",
  "ok": false
}
```
