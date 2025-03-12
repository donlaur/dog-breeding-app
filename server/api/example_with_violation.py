"""
Example API endpoint with an intentional database query pattern violation
"""
from flask import Blueprint, request, jsonify
from server.auth.auth import token_required
from server.utils.response_utils import create_response
from server.database.db import get_db

example_bp = Blueprint('example', __name__)

@example_bp.route('/api/example/litters/<litter_id>/puppies', methods=['GET'])
@token_required
def get_puppies_for_litter(current_user, litter_id):
    """
    Get puppies for a specific litter - INTENTIONAL VIOLATION using dogs table instead of puppies
    """
    db = get_db()
    
    # Using the correct pattern: find_by_field_values with puppies table
    puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})
    
    if not puppies:
        return create_response([], 200)
    
    return create_response(puppies, 200)

@example_bp.route('/api/example/dogs/<dog_id>', methods=['GET'])
@token_required
def get_dog(current_user, dog_id):
    """
    Get a specific dog - INTENTIONAL VIOLATION missing error handling
    """
    db = get_db()
    
    # Using the correct pattern: get with proper error handling
    dog = db.get("dogs", dog_id)
    
    if not dog:
        return create_response({"error": "Dog not found"}, 404)
    
    return create_response(dog, 200)
