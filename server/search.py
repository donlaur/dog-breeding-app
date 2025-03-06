"""
search.py

Implements search functionality across multiple entity types in the application.
"""

from flask import Blueprint, request, jsonify
from server.database.interface import DatabaseInterface
from server.config import debug_log

def create_search_bp(db: DatabaseInterface) -> Blueprint:
    """Create a blueprint with search endpoints
    
    Args:
        db: The database interface
        
    Returns:
        A Flask Blueprint with search routes
    """
    search_bp = Blueprint("search_bp", __name__)
    
    @search_bp.route("/", methods=["GET"])
    def search():
        """Search across multiple entity types
        
        Query parameters:
            q: The search query
            type: Optional entity type filter (dogs, puppies, litters, all)
        
        Returns:
            JSON with search results grouped by entity type
        """
        try:
            # Get search parameters
            query = request.args.get("q", "")
            entity_type = request.args.get("type", "all")
            
            if not query:
                return jsonify({"error": "Query parameter 'q' is required"}), 400
                
            debug_log(f"Search request: query='{query}', type='{entity_type}'")
            
            results = {}
            
            # Search dogs
            if entity_type in ["all", "dogs"]:
                dog_results = search_dogs(db, query)
                if dog_results:
                    results["dogs"] = dog_results
            
            # Search puppies
            if entity_type in ["all", "puppies"]:
                puppy_results = search_puppies(db, query)
                if puppy_results:
                    results["puppies"] = puppy_results
            
            # Search litters
            if entity_type in ["all", "litters"]:
                litter_results = search_litters(db, query)
                if litter_results:
                    results["litters"] = litter_results
                    
            # Add breed information to results that have breed_id
            enrich_breed_data(db, results)
            
            debug_log(f"Search results: {len(results.get('dogs', []))} dogs, " +
                     f"{len(results.get('puppies', []))} puppies, " +
                     f"{len(results.get('litters', []))} litters")
                     
            return jsonify(results)
            
        except Exception as e:
            debug_log(f"Error in search: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    return search_bp

def search_dogs(db: DatabaseInterface, query: str):
    """Search for dogs matching the query
    
    Args:
        db: The database interface
        query: The search query
        
    Returns:
        List of matching dog records
    """
    # Search dog name, registered name, and microchip
    try:
        response = db.supabase.table("dogs").select("*").or_(
            f"call_name.ilike.%{query}%," +
            f"registered_name.ilike.%{query}%," +
            f"microchip.ilike.%{query}%," +
            f"color.ilike.%{query}%"
        ).execute()
        
        return response.data
    except Exception as e:
        debug_log(f"Error searching dogs: {str(e)}")
        return []

def search_puppies(db: DatabaseInterface, query: str):
    """Search for puppies matching the query
    
    Args:
        db: The database interface
        query: The search query
        
    Returns:
        List of matching puppy records
    """
    try:
        response = db.supabase.table("puppies").select("*").or_(
            f"name.ilike.%{query}%," +
            f"microchip.ilike.%{query}%," +
            f"color.ilike.%{query}%"
        ).execute()
        
        return response.data
    except Exception as e:
        debug_log(f"Error searching puppies: {str(e)}")
        return []

def search_litters(db: DatabaseInterface, query: str):
    """Search for litters matching the query
    
    Args:
        db: The database interface
        query: The search query
        
    Returns:
        List of matching litter records with dam and sire names
    """
    try:
        # First get litters that match the query
        response = db.supabase.table("litters").select("*").or_(
            f"litter_name.ilike.%{query}%," +
            f"description.ilike.%{query}%"
        ).execute()
        
        litters = response.data
        
        # Enrich with dam and sire information
        for litter in litters:
            if 'dam_id' in litter and litter['dam_id']:
                dam = db.supabase.table("dogs").select("call_name").eq("id", litter['dam_id']).execute()
                if dam.data:
                    litter['dam_name'] = dam.data[0].get('call_name', '')
                    
            if 'sire_id' in litter and litter['sire_id']:
                sire = db.supabase.table("dogs").select("call_name").eq("id", litter['sire_id']).execute()
                if sire.data:
                    litter['sire_name'] = sire.data[0].get('call_name', '')
        
        return litters
    except Exception as e:
        debug_log(f"Error searching litters: {str(e)}")
        return []

def enrich_breed_data(db: DatabaseInterface, results):
    """Add breed information to search results
    
    Args:
        db: The database interface
        results: Search results dictionary to enrich
    """
    try:
        # Get all breeds for lookup
        breeds_response = db.supabase.table("dog_breeds").select("*").execute()
        breeds = {breed['id']: breed for breed in breeds_response.data}
        
        # Add breed info to dogs
        if 'dogs' in results:
            for dog in results['dogs']:
                if 'breed_id' in dog and dog['breed_id'] in breeds:
                    dog['breed_name'] = breeds[dog['breed_id']]['name']
        
        # Add breed info to puppies through their litters
        if 'puppies' in results:
            # Get litter information for all puppies
            litter_ids = [p['litter_id'] for p in results['puppies'] if 'litter_id' in p]
            if litter_ids:
                litters_response = db.supabase.table("litters").select("*").in_("id", litter_ids).execute()
                litters = {litter['id']: litter for litter in litters_response.data}
                
                # Get dog information for dams and sires
                dog_ids = []
                for litter in litters.values():
                    if 'dam_id' in litter and litter['dam_id']:
                        dog_ids.append(litter['dam_id'])
                    if 'sire_id' in litter and litter['sire_id']:
                        dog_ids.append(litter['sire_id'])
                
                if dog_ids:
                    dogs_response = db.supabase.table("dogs").select("*").in_("id", dog_ids).execute()
                    dogs = {dog['id']: dog for dog in dogs_response.data}
                    
                    # Enrich puppies with breed info from dam
                    for puppy in results['puppies']:
                        if 'litter_id' in puppy and puppy['litter_id'] in litters:
                            litter = litters[puppy['litter_id']]
                            
                            # Try to get breed from dam first
                            if 'dam_id' in litter and litter['dam_id'] in dogs:
                                dam = dogs[litter['dam_id']]
                                if 'breed_id' in dam and dam['breed_id'] in breeds:
                                    puppy['breed_name'] = breeds[dam['breed_id']]['name']
    except Exception as e:
        debug_log(f"Error enriching breed data: {str(e)}")