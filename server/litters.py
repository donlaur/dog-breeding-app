from flask import Blueprint, jsonify, request
from server.utils.auth import login_required
from server.config import debug_log

litters_bp = Blueprint('litters', __name__)

def create_litters_bp(db):
    """Create and return the litters blueprint with the provided database instance"""
    
    @litters_bp.route("/", methods=["GET"])
    def get_all_litters():
        """Get all litters"""
        try:
litters = db.find_by_field_values("litters")
            
            # Add CORS headers
            response = jsonify(litters)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
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
            
            # Get dam and sire information if IDs are present
            if litter.get('dam_id'):
                dam = db.get("dogs", litter['dam_id'])
                if dam:
                    # Add dam information as separate fields instead of using dam_name
                    response_data['dam_info'] = {
                        'id': dam.get('id'),
                        'call_name': dam.get('call_name', 'Unknown')
                    }
            
            if litter.get('sire_id'):
                sire = db.get("dogs", litter['sire_id'])
                if sire:
                    # Add sire information as separate fields instead of using sire_name
                    response_data['sire_info'] = {
                        'id': sire.get('id'),
                        'call_name': sire.get('call_name', 'Unknown')
                    }
            
            # Get breed information if breed_id is present
            if litter.get('breed_id'):
                breed = db.get("dog_breeds", litter['breed_id'])
                if breed:
                    # Add breed information as a separate field
                    response_data['breed_info'] = {
                        'id': breed.get('id'),
                        'name': breed.get('name', 'Unknown Breed')
                    }
            
            # Add CORS headers
            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            debug_log(f"Error in get_litter: {str(e)}")
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

    @litters_bp.route("/<int:litter_id>/puppies", methods=["GET"])
    def get_litter_puppies(litter_id):
        try:
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Query puppies table for puppies with this litter_id
            # Using find_by_field_values instead of find with filters
            puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})
            debug_log(f"Found {len(puppies)} puppies for litter {litter_id}")
            
            # Add CORS headers
            response = jsonify(puppies)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
            
        except Exception as e:
            debug_log(f"Error in get_litter_puppies: {str(e)}")
            return jsonify({"error": str(e)}), 500
            
    return litters_bp
