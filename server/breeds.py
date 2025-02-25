"""
breeds.py

Blueprint for breed-related endpoints, including:
- Retrieving all dog breeds
- Retrieving a specific breed
"""

from flask import Blueprint, jsonify
from server.database.supabase_db import SupabaseDatabase

print("Initializing breeds blueprint...")  # Debug print

# Create blueprint with explicit name
breeds_bp = Blueprint('breeds_bp', __name__)

# Get database instance
db = SupabaseDatabase()

@breeds_bp.route('/', methods=['GET'])
def get_breeds():
    print("Breeds endpoint hit: get_breeds()")
    try:
        result = db.supabase.table('dog_breeds').select('*').execute()
        print(f"Breeds fetch successful, found {len(result.data)} breeds")
        return jsonify(result.data if result.data else [])
    except Exception as e:
        print(f"Error in get_breeds: {str(e)}")
        return jsonify({'error': str(e)}), 500

@breeds_bp.route('/<int:breed_id>', methods=['GET'])
def get_breed(breed_id):
    print(f"Breeds endpoint hit: get_breed({breed_id})")
    try:
        result = db.supabase.table('dog_breeds').select('*').eq('id', breed_id).execute()
        breed = result.data[0] if result.data else None
        
        if breed is None:
            return jsonify({'error': 'Breed not found'}), 404
            
        return jsonify(breed)
    except Exception as e:
        print(f"Error in get_breed: {str(e)}")
        return jsonify({'error': str(e)}), 500

print("Breeds blueprint initialized successfully")  # Debug print

# Export the blueprint
__all__ = ['breeds_bp']
