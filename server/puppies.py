"""
puppies.py

Blueprint for puppy-related endpoints, including:
- Creating new puppies within a litter
- Updating puppy details
- Retrieving puppy information
- Managing puppy availability
"""

from flask import Blueprint, request, jsonify, make_response
from server.database.db_interface import DatabaseInterface
from server.database.supabase_db import DatabaseError
from server.config import debug_log
import traceback

def create_puppies_bp(db: DatabaseInterface) -> Blueprint:
    puppies_bp = Blueprint("puppies_bp", __name__)

    @puppies_bp.route('', methods=['GET', 'POST', 'OPTIONS'])
    @puppies_bp.route('/', methods=['GET', 'POST', 'OPTIONS'])
    def handle_puppies():
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            return response, 204

        if request.method == 'POST':
            debug_log("Creating new puppy...")
            try:
                data = request.get_json()
                debug_log(f"Received puppy data: {data}")
                
                if not data or not data.get('litter_id'):
                    return jsonify({"error": "Litter ID is required"}), 400
                
                # Map frontend field names to database field names
                puppy_data = {}
                
                # Map known fields
                field_mapping = {
                    'name': 'name',
                    'gender': 'gender',
                    'color': 'color',
                    'markings': 'markings',
                    'birthdate': 'birth_date',  # Confirmed mapping
                    'weight_birth': 'weight_at_birth',  # Confirmed mapping (full column name)
                    'description': 'description',
                    'litter_id': 'litter_id',
                    'status': 'status',
                    'is_available': 'is_available',
                    'call_name': 'call_name',
                    'registered_name': 'registered_name',
                    'microchip': 'microchip',
                    'notes': 'notes',
                    'breed_id': 'breed_id',
                    'sire_id': 'sire_id',
                    'dam_id': 'dam_id',
                    'program_id': 'program_id',
                    'registration_type': 'registration_type',
                    'collar_color': 'collar_color',
                    'price': 'price'
                }
                
                # Copy fields with proper mapping
                for frontend_field, db_field in field_mapping.items():
                    if frontend_field in data:
                        puppy_data[db_field] = data[frontend_field]
                
                # Gender format standardization (e.g., 'male' -> 'Male')
                if 'gender' in puppy_data and puppy_data['gender']:
                    # Capitalize first letter
                    puppy_data['gender'] = puppy_data['gender'].capitalize()
                
                # Ensure the litter_id is an integer
                if 'litter_id' in puppy_data and puppy_data['litter_id']:
                    try:
                        puppy_data['litter_id'] = int(puppy_data['litter_id'])
                    except (ValueError, TypeError):
                        debug_log(f"Invalid litter_id format: {puppy_data['litter_id']}")
                
                # Set default status if not provided
                if 'status' not in puppy_data or not puppy_data['status']:
                    puppy_data['status'] = 'Available'
                
                debug_log(f"Mapped puppy data: {puppy_data}")
                
                # Create new puppy in database
                puppy = db.create("puppies", puppy_data)
                debug_log(f"Created puppy: {puppy}")
                return jsonify(puppy), 201
            except Exception as e:
                debug_log(f"Error creating puppy: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        # GET method to list all puppies
        debug_log("Fetching all puppies...")
        try:
            puppies = db.get_all("puppies")
            debug_log(f"Found {len(puppies)} puppies")
            return jsonify(puppies)
        except Exception as e:
            debug_log(f"Error fetching puppies: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @puppies_bp.route('/<int:puppy_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    def handle_puppy(puppy_id):
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
            return response, 204

        # GET method to fetch a specific puppy
        if request.method == 'GET':
            debug_log(f"Fetching puppy with ID: {puppy_id}")
            try:
                puppy = db.get_by_id("puppies", puppy_id)
                if not puppy:
                    return jsonify({"error": "Puppy not found"}), 404
                return jsonify(puppy)
            except Exception as e:
                debug_log(f"Error fetching puppy: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        # PUT method to update a puppy
        elif request.method == 'PUT':
            debug_log(f"Updating puppy with ID: {puppy_id}")
            try:
                data = request.get_json()
                
                # Map frontend field names to database field names (same as in POST)
                puppy_data = {}
                field_mapping = {
                    'name': 'name',
                    'gender': 'gender',
                    'color': 'color',
                    'markings': 'markings',
                    'birthdate': 'birth_date',
                    'weight_birth': 'weight_at_birth',
                    'description': 'description',
                    'litter_id': 'litter_id',
                    'status': 'status',
                    'is_available': 'is_available',
                    'call_name': 'call_name',
                    'registered_name': 'registered_name',
                    'microchip': 'microchip',
                    'notes': 'notes',
                    'breed_id': 'breed_id',
                    'sire_id': 'sire_id',
                    'dam_id': 'dam_id',
                    'program_id': 'program_id',
                    'registration_type': 'registration_type',
                    'collar_color': 'collar_color',
                    'price': 'price'
                }
                
                for frontend_field, db_field in field_mapping.items():
                    if frontend_field in data:
                        puppy_data[db_field] = data[frontend_field]
                
                # Gender format standardization (e.g., 'male' -> 'Male')
                if 'gender' in puppy_data and puppy_data['gender']:
                    # Capitalize first letter
                    puppy_data['gender'] = puppy_data['gender'].capitalize()
                
                # Integer conversion for IDs
                id_fields = ['litter_id', 'breed_id', 'sire_id', 'dam_id', 'program_id']
                for field in id_fields:
                    if field in puppy_data and puppy_data[field]:
                        try:
                            puppy_data[field] = int(puppy_data[field])
                        except (ValueError, TypeError):
                            debug_log(f"Invalid {field} format: {puppy_data[field]}")
                
                updated_puppy = db.update("puppies", puppy_id, puppy_data)
                return jsonify(updated_puppy)
            except Exception as e:
                debug_log(f"Error updating puppy: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        # DELETE method to delete a puppy
        elif request.method == 'DELETE':
            debug_log(f"Deleting puppy with ID: {puppy_id}")
            try:
                db.delete("puppies", puppy_id)
                return jsonify({"message": "Puppy deleted successfully"})
            except Exception as e:
                debug_log(f"Error deleting puppy: {str(e)}")
                return jsonify({"error": str(e)}), 500

    @puppies_bp.route('/litter/<int:litter_id>', methods=['GET', 'OPTIONS'])
    def get_puppies_by_litter(litter_id):
        try:
            debug_log(f"Fetching puppies for litter ID: {litter_id}")
            
            # Use the database abstraction to find puppies by litter_id
            puppies = db.find_by_field("puppies", "litter_id", litter_id)
            
            debug_log(f"Found {len(puppies)} puppies for litter ID {litter_id}")
            
            # Add CORS headers
            response = make_response(jsonify(puppies))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching puppies for litter: {str(e)}")
            debug_log(traceback.format_exc())
            
            # Add CORS headers to error response
            response = jsonify({"error": str(e)})
            response.status_code = 500
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response

    return puppies_bp