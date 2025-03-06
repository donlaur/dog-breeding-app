# Search Functionality

## Overview

The application now features a comprehensive search functionality that allows users to search across multiple entity types (dogs, puppies, litters) from a single search interface. The search is accessible from the dashboard header and provides categorized results with detailed information.

## Architecture

### Backend

The search functionality is implemented with the following components:

1. **Search API Endpoint**
   - Path: `/api/search`
   - Query parameters: 
     - `q`: Search query text
     - `type`: (Optional) Filter by entity type (dogs, puppies, litters, all)
   - Returns: JSON object with categorized results

2. **Search Implementation**
   - Uses PostgreSQL's `ilike` operator for case-insensitive pattern matching
   - Searches across multiple fields (names, colors, microchips, etc.)
   - Results are enriched with related data (breed names, parent information)

Example search endpoint:
```python
@search_bp.route("/", methods=["GET"])
def search():
    query = request.args.get("q", "")
    entity_type = request.args.get("type", "all")
    
    results = {}
    
    if entity_type in ["all", "dogs"]:
        results["dogs"] = search_dogs(db, query)
    
    if entity_type in ["all", "puppies"]:
        results["puppies"] = search_puppies(db, query)
    
    if entity_type in ["all", "litters"]:
        results["litters"] = search_litters(db, query)
    
    return jsonify(results)
```

### Frontend

1. **Search Bar**
   - Located in the dashboard header
   - Available on desktop and mobile views
   - Submits search on Enter key press or icon click

2. **Search Results Page**
   - Path: `/dashboard/search`
   - Features:
     - Tabs for filtering by entity type
     - Count indicators for each category
     - Rich result displays with thumbnails and key information
     - Links to entity detail pages
     - Empty state handling
     - Loading indicators

## Usage

Users can search for:
- Dogs by name, registered name, microchip, or color
- Puppies by name, microchip, or color
- Litters by name or description

Search results display relevant information for each entity type:
- Dogs: Name, registered name, breed, gender, color
- Puppies: Name, breed, gender, color, status
- Litters: Name, dam/sire information, whelp date, puppy count, status

Clicking on any result navigates to the corresponding detail page.

## Technical Notes

- The search implementation uses direct Supabase queries for optimal performance
- Results are enriched with related data (like breed information) to provide context
- The UI handles empty results and loading states for a better user experience
- The search is designed to be extensible - new entity types can be added easily