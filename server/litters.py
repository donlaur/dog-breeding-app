from flask import Blueprint, jsonify, request, make_response
from server.utils.auth import login_required
from server.config import debug_log
from server.models.notification import Notification
import traceback

litters_bp = Blueprint('litters', __name__)

def create_litters_bp(db):
    """Create and return the litters blueprint with the provided database instance"""
    
    @litters_bp.route("/", methods=["GET"])
    def get_all_litters():
        """Get all litters with optional filtering by sire_id or dam_id"""
        try:
            # Check for query parameters
            sire_id = request.args.get('sire_id')
            dam_id = request.args.get('dam_id')
            dog_id = request.args.get('dog_id')
            
            filter_conditions = {}
            
            # Handle filtering by dog_id (either sire or dam)
            if dog_id:
                # This will return litters where this dog is either a sire or dam
                dog_litters = db.find_by_query(
                    "litters", 
                    f"sire_id = {dog_id} OR dam_id = {dog_id}"
                )
                
                if not dog_litters:
                    # Return an empty list rather than an error
                    response = jsonify([])
                    response.headers.add('Access-Control-Allow-Origin', '*')
                    return response
                
                # Use the dog litters found by query
                litters = dog_litters
            # Handle specific filter by sire_id
            elif sire_id:
                filter_conditions['sire_id'] = sire_id
                litters = db.find_by_field_values("litters", filter_conditions)
            # Handle specific filter by dam_id
            elif dam_id:
                filter_conditions['dam_id'] = dam_id
                litters = db.find_by_field_values("litters", filter_conditions)
            # No filters, get all litters
            else:
                litters = db.find_by_field_values("litters", {})
            
            # Enhance each litter with dam and sire information
            enhanced_litters = []
            for litter in litters:
                litter_data = {**litter}
                
                # Get dam information if dam_id is present
                if litter.get('dam_id'):
                    dam = db.get("dogs", litter['dam_id'])
                    if not dam:
                        litter_data['dam_name'] = 'Unknown'
                        litter_data['dam'] = {
                            'id': litter.get('dam_id'),
                            'call_name': 'Unknown',
                            'registered_name': ''
                        }
                    else:
                        litter_data['dam_name'] = dam.get('call_name', 'Unknown')
                        litter_data['dam'] = dam  # Add full dam object
                
                # Get sire information if sire_id is present
                if litter.get('sire_id'):
                    sire = db.get("dogs", litter['sire_id'])
                    if not sire:
                        litter_data['sire_name'] = 'Unknown'
                        litter_data['sire'] = {
                            'id': litter.get('sire_id'),
                            'call_name': 'Unknown',
                            'registered_name': ''
                        }
                    else:
                        litter_data['sire_name'] = sire.get('call_name', 'Unknown')
                        litter_data['sire'] = sire  # Add full sire object
                
                enhanced_litters.append(litter_data)
            
            # Add CORS headers
            response = jsonify(enhanced_litters)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            debug_log(f"Error in get_all_litters: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["GET"])
    def get_litter(litter_id):
        """Get a specific litter by ID"""
        try:
            litter = db.get("litters", litter_id)
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Create a response object that includes the litter data
            response_data = {**litter}
            
            # Get dam information if dam_id is present
            if litter.get('dam_id'):
                dam = db.get("dogs", litter['dam_id'])
                if not dam:
                    response_data['dam_info'] = {
                        'id': litter.get('dam_id'),
                        'call_name': 'Unknown',
                        'registered_name': ''
                    }
                    response_data['dam_name'] = 'Unknown'
                else:
                    # Add dam information as separate fields
                    response_data['dam_info'] = {
                        'id': dam.get('id'),
                        'call_name': dam.get('call_name', 'Unknown'),
                        'registered_name': dam.get('registered_name', '')
                    }
                    # Add dam_name for backward compatibility
                    response_data['dam_name'] = dam.get('call_name', 'Unknown')
            else:
                response_data['dam_info'] = {
                    'id': None,
                    'call_name': 'Unknown',
                    'registered_name': ''
                }
                response_data['dam_name'] = 'Unknown'
            
            # Get sire information if sire_id is present
            if litter.get('sire_id'):
                sire = db.get("dogs", litter['sire_id'])
                if not sire:
                    response_data['sire_info'] = {
                        'id': litter.get('sire_id'),
                        'call_name': 'Unknown',
                        'registered_name': ''
                    }
                    response_data['sire_name'] = 'Unknown'
                else:
                    # Add sire information as separate fields
                    response_data['sire_info'] = {
                        'id': sire.get('id'),
                        'call_name': sire.get('call_name', 'Unknown'),
                        'registered_name': sire.get('registered_name', '')
                    }
                    # Add sire_name for backward compatibility
                    response_data['sire_name'] = sire.get('call_name', 'Unknown')
            else:
                response_data['sire_info'] = {
                    'id': None,
                    'call_name': 'Unknown',
                    'registered_name': ''
                }
                response_data['sire_name'] = 'Unknown'
            
            # Format whelp_date properly if it exists
            if 'whelp_date' in litter and litter['whelp_date']:
                response_data['whelp_date'] = litter['whelp_date']
            
            # Get breed information if breed_id is present
            if litter.get('breed_id'):
                breed = db.get("dog_breeds", litter['breed_id'])
                if breed:
                    # Add breed information as a separate field
                    response_data['breed_info'] = {
                        'id': breed.get('id'),
                        'name': breed.get('name', 'Unknown Breed')
                    }
                else:
                    response_data['breed_info'] = {
                        'id': litter.get('breed_id'),
                        'name': 'Unknown Breed'
                    }
            else:
                response_data['breed_info'] = {
                    'id': None,
                    'name': 'Unknown Breed'
                }
            
            # Add CORS headers
            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/test/<int:litter_id>", methods=["GET"])
    def test_get_litter(litter_id):
        """Test endpoint to debug litter retrieval"""
        try:
            debug_log(f"TEST: Fetching litter with ID: {litter_id}")
            litter = db.get("litters", litter_id)
            if not litter:
                debug_log(f"TEST: Litter with ID {litter_id} not found")
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            debug_log(f"TEST: Litter data: {litter}")
            
            # Get sire information if sire_id is present
            if litter.get('sire_id'):
                debug_log(f"TEST: Fetching sire with ID: {litter['sire_id']}")
                sire = db.get("dogs", litter['sire_id'])
                debug_log(f"TEST: Sire lookup result: {sire}")
                if sire:
                    debug_log(f"TEST: Found sire: {sire.get('call_name', 'Unknown')}")
                else:
                    debug_log(f"TEST: Sire with ID {litter['sire_id']} not found in database")
            else:
                debug_log("TEST: No sire_id present in litter data")
            
            return jsonify({"litter": litter}), 200
            
        except Exception as e:
            debug_log(f"TEST: Error in test_get_litter: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/", methods=["POST"])
    @login_required
    def create_litter():
        """Create a new litter"""
        try:
            data = request.json
            
            # Validate required fields
            required_fields = ['dam_id', 'sire_id', 'whelp_date']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Create litter
            litter = db.create("litters", data)
            
            # Add CORS headers
            response = jsonify(litter)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["PUT"])
    @login_required
    def update_litter(litter_id):
        """Update a litter"""
        try:
            data = request.json
            
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Update litter
            updated_litter = db.update("litters", litter_id, data)
            
            # Add CORS headers
            response = jsonify(updated_litter)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["DELETE"])
    @login_required
    def delete_litter(litter_id):
        """Delete a litter"""
        try:
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Delete litter
            success = db.delete("litters", litter_id)
            
            if not success:
                return jsonify({"error": "Failed to delete litter"}), 500
            
            # Add CORS headers
            response = jsonify({"message": f"Litter with ID {litter_id} deleted successfully"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/dog/<int:dog_id>", methods=["GET"])
    def get_litters_by_dog(dog_id):
        """Get all litters where the dog is either a sire or dam"""
        try:
            # Find litters where this dog is either the sire or dam
            dog_litters = db.find_by_query(
                "litters", 
                f"sire_id = {dog_id} OR dam_id = {dog_id}"
            )
            
            if not dog_litters:
                response = jsonify([])
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response
            
            # Enhance each litter with dam and sire information
            enhanced_litters = []
            for litter in dog_litters:
                litter_data = {**litter}
                
                # Get dam information if dam_id is present
                if litter.get('dam_id'):
                    dam = db.get("dogs", litter['dam_id'])
                    if not dam:
                        litter_data['dam_name'] = 'Unknown'
                        litter_data['dam'] = {
                            'id': litter.get('dam_id'),
                            'call_name': 'Unknown',
                            'registered_name': ''
                        }
                    else:
                        litter_data['dam_name'] = dam.get('call_name', 'Unknown')
                        litter_data['dam'] = dam  # Add full dam object
                
                # Get sire information if sire_id is present
                if litter.get('sire_id'):
                    sire = db.get("dogs", litter['sire_id'])
                    if not sire:
                        litter_data['sire_name'] = 'Unknown'
                        litter_data['sire'] = {
                            'id': litter.get('sire_id'),
                            'call_name': 'Unknown',
                            'registered_name': ''
                        }
                    else:
                        litter_data['sire_name'] = sire.get('call_name', 'Unknown')
                        litter_data['sire'] = sire  # Add full sire object
                
                enhanced_litters.append(litter_data)
            
            # Add CORS headers
            response = jsonify(enhanced_litters)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @litters_bp.route("/<int:litter_id>/puppies", methods=["GET"])
    def get_litter_puppies(litter_id):
        """Get all puppies for a specific litter"""
        try:
            debug_log(f"Fetching puppies for litter ID: {litter_id}")
            
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                debug_log(f"Litter with ID {litter_id} not found")
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Query puppies table for puppies with this litter_id
            # Using find_by_field_values instead of find with filters
            debug_log(f"Querying puppies table for litter_id={litter_id}")
            puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})
            debug_log(f"Found {len(puppies)} puppies for litter {litter_id}")
            
            # If no puppies found, return an empty array instead of an error
            if not puppies:
                debug_log(f"No puppies found for litter {litter_id}, returning empty array")
                response = jsonify([])
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response
            
            # Log each puppy for debugging
            for i, puppy in enumerate(puppies):
                debug_log(f"Puppy {i+1}: ID={puppy.get('id')}, Name={puppy.get('name', 'Unnamed')}")
            
            # Add CORS headers
            response = jsonify(puppies)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            debug_log(f"Error in get_litter_puppies: {str(e)}")
            return jsonify({"error": str(e)}), 500
            
    @litters_bp.route("/<int:litter_id>/puppies", methods=["POST", "OPTIONS"])
    @login_required
    def add_puppy_to_litter(litter_id):
        """Add a new puppy to a litter"""
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            return response, 204
            
        try:
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                debug_log(f"Litter with ID {litter_id} not found")
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            data = request.json
            debug_log(f"Received puppy data: {data}")
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Ensure litter_id is set in the data
            data['litter_id'] = litter_id
            
            # Remove any non-schema fields that might cause errors
            non_schema_fields = ['dam_name', 'sire_name', 'breed_name', 'dam_info', 'sire_info', 'breed_info']
            for field in non_schema_fields:
                if field in data:
                    debug_log(f"Removing non-schema field: {field}")
                    del data[field]
            
            # Create the puppy record
            # Using the puppies table, not dogs table
            debug_log(f"Creating puppy with data: {data}")
            puppy = db.create("puppies", data)
            debug_log(f"Created puppy: {puppy}")
            
            # Create a notification for the new puppy
            try:
                # Get litter information for the notification
                litter_info = ""
                if litter.get('name'):
                    litter_info = f" in litter '{litter['name']}'"
                
                # Create notification
                notification = Notification(
                    title="New Puppy Added",
                    message=f"A new puppy '{data.get('name', 'Unnamed')}'{litter_info} has been added.",
                    type="puppy_created",
                    related_id=puppy.get('id'),
                    related_type="puppy"
                )
                notification.create()
                debug_log(f"Created notification for new puppy")
            except Exception as e:
                debug_log(f"Error creating notification: {str(e)}")
                # Continue even if notification creation fails
            
            # Add CORS headers
            response = jsonify(puppy)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 201
            
        except Exception as e:
            debug_log(f"Error adding puppy to litter: {str(e)}")
            debug_log(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
            
    return litters_bp
