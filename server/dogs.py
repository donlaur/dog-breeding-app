"""
dogs.py

Blueprint for all dog-related endpoints (CRUD + file uploads).
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify, current_app, make_response
from werkzeug.utils import secure_filename
from datetime import datetime
from server.supabase_client import supabase
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_dogs_bp(db: DatabaseInterface) -> Blueprint:
    dogs_bp = Blueprint("dogs_bp", __name__)

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    if not SUPABASE_URL:
        raise ValueError("Missing SUPABASE_URL in environment variables.")
    # Derive domain from SUPABASE_URL (e.g., if SUPABASE_URL is "https://xyz.supabase.co")
    domain = SUPABASE_URL.split("://")[-1]

    def parse_int_field_silent(form, field):
        if field in form:
            val = form[field].strip().lower()
            if val in ("", "null"):
                form[field] = None
            else:
                try:
                    form[field] = int(val)
                except ValueError:
                    form[field] = None

    def parse_float_field_silent(form, field):
        if field in form:
            val = form[field].strip().lower()
            if val in ("", "null"):
                form[field] = None
            else:
                try:
                    form[field] = float(val)
                except ValueError:
                    form[field] = None

    def parse_int_field_silent_json(data, field):
        if field in data:
            val = str(data[field]).strip().lower()
            if val in ("", "null"):
                data[field] = None
            else:
                try:
                    data[field] = int(val)
                except ValueError:
                    data[field] = None

    def parse_float_field_silent_json(data, field):
        if field in data:
            val = str(data[field]).strip().lower()
            if val in ("", "null"):
                data[field] = None
            else:
                try:
                    data[field] = float(val)
                except ValueError:
                    data[field] = None

    @dogs_bp.route("/", methods=["GET"])
    def get_dogs():
        try:
            debug_log("Fetching all dogs...")
            
            # Import the default breeder ID from config
            from server.config import DEFAULT_BREEDER_ID
            
            # Extract breeder_id from query params, default to DEFAULT_BREEDER_ID if not specified
            breeder_id = request.args.get('breeder_id', DEFAULT_BREEDER_ID)
            
            try:
                # Convert to int if it's a string
                breeder_id = int(breeder_id)
            except ValueError:
                # If not a valid int, use the default
                breeder_id = DEFAULT_BREEDER_ID
                
            debug_log(f"Filtering dogs by breeder_id: {breeder_id}")
            
            # Use the abstracted db interface with breeder_id filter
            dogs = db.find_by_field_values("dogs", {"breeder_id": breeder_id})
            
            debug_log(f"Found {len(dogs)} dogs for breeder_id {breeder_id}")
            
            # Add CORS headers to response
            response = jsonify(dogs)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching dogs: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["GET"])
    def get_dog(dog_id):
        try:
            debug_log(f"Fetching dog with ID: {dog_id}")
            
            # Import the default breeder ID from config
            from server.config import DEFAULT_BREEDER_ID
            
            # Get breeder_id from query params if provided
            breeder_id = request.args.get('breeder_id')
            if breeder_id:
                try:
                    breeder_id = int(breeder_id)
                except ValueError:
                    breeder_id = DEFAULT_BREEDER_ID
            
            # Use the abstracted db interface
            dog = db.get("dogs", dog_id)
            
            if not dog:
                debug_log(f"Dog not found with ID: {dog_id}")
                response = jsonify({"error": f"Dog with ID {dog_id} not found"})
                response.status_code = 404
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                return response
            
            # Check if dog belongs to the requested breeder
            if breeder_id and dog.get('breeder_id') and dog['breeder_id'] != breeder_id:
                debug_log(f"Dog with ID {dog_id} belongs to breeder {dog['breeder_id']}, not requested breeder {breeder_id}")
                response = jsonify({"error": f"Dog with ID {dog_id} not found for breeder {breeder_id}"})
                response.status_code = 404
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                return response
            
            debug_log(f"Found dog: {dog}")
            
            # Add CORS headers to response
            response = jsonify(dog)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching dog: {str(e)}")
            response = jsonify({"error": str(e)})
            response.status_code = 500
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response

    @dogs_bp.route("/", methods=["POST"])
    def create_dog():
        try:
            debug_log("Creating new dog")
            
            # Get data from request
            data = {}
            if request.is_json:
                data = request.get_json()
                debug_log(f"Received JSON data: {data}")
            else:
                # Handle form data
                form_data = request.form.to_dict()
                debug_log(f"Received form data: {form_data}")
                
                # Process form data
                for key, value in form_data.items():
                    data[key] = value
                
                # Handle file upload
                if 'photo' in request.files:
                    file = request.files['photo']
                    if file and file.filename:
                        # Process file upload logic here
                        # ...
                        pass
            
            # Ensure breeder_id is set
            if 'breeder_id' not in data or not data['breeder_id']:
                # Get breeder_id from token/session if available
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    # In a production app, we would extract the breeder_id from the token
                    # For now, use the default breeder_id from config
                    from server.config import DEFAULT_BREEDER_ID
                    data['breeder_id'] = DEFAULT_BREEDER_ID
                else:
                    # Default fallback if no token
                    from server.config import DEFAULT_BREEDER_ID
                    data['breeder_id'] = DEFAULT_BREEDER_ID
                
                debug_log(f"Added default breeder_id: {data['breeder_id']}")
            
            debug_log(f"Processed data for dog creation: {data}")
            
            # Create the dog using the abstracted db interface
            dog = db.create("dogs", data)
            
            # Add CORS headers to response
            response = jsonify(dog)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error creating dog: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["PUT"])
    def update_dog(dog_id):
        try:
            # Check if dog exists
            existing_dog = db.get("dogs", dog_id)
            
            if not existing_dog:
                return jsonify({"error": f"Dog with ID {dog_id} not found"}), 404
            
            data = request.get_json()
            
            # Preserve the original breeder_id to maintain data integrity
            # This ensures a dog can't be moved to another breeder accidentally
            if 'breeder_id' in data and existing_dog.get('breeder_id') and data['breeder_id'] != existing_dog['breeder_id']:
                debug_log(f"Attempt to change breeder_id from {existing_dog['breeder_id']} to {data['breeder_id']} prevented")
                data['breeder_id'] = existing_dog['breeder_id']
            
            # Update the dog using the abstracted db interface
            updated_dog = db.update("dogs", dog_id, data)
            
            # Add CORS headers to response
            response = jsonify(updated_dog)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error updating dog: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["DELETE"])
    def delete_dog(dog_id):
        try:
            # Check if dog exists
            existing_dog = db.get("dogs", dog_id)
            
            if not existing_dog:
                return jsonify({"error": f"Dog with ID {dog_id} not found"}), 404
            
            # Delete the dog using the abstracted db interface
            db.delete("dogs", dog_id)
            
            # Add CORS headers to response
            response = jsonify({"message": f"Dog with ID {dog_id} deleted successfully"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error deleting dog: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/upload", methods=["POST"])
    def upload_file():
        # Check for both 'file' and 'photo' parameters for compatibility
        file = request.files.get("file") or request.files.get("photo")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        debug_log(f"Processing file upload: {file.filename}")

        original_filename = secure_filename(file.filename)
        # Create a cleaner unique ID without underscores for better URL compatibility
        unique_id = str(uuid.uuid4())[:8]
        
        # Extract file extension
        file_ext = ""
        if "." in original_filename:
            file_ext = os.path.splitext(original_filename)[1]
        
        # Create a clean filename with the extension
        final_filename = f"{unique_id}{file_ext}"
        
        # Create the uploads directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # Define the file path
        file_path = os.path.join(upload_dir, final_filename)
        
        try:
            # Save the file directly to the uploads directory
            file.save(file_path)
            
            debug_log(f"File saved successfully to {file_path}")
            
            # Generate the URL (no underscore in filename)
            file_url = f"/uploads/{final_filename}"
            absolute_url = f"{request.host_url.rstrip('/')}{file_url}"
            
            # Return both relative and absolute URLs for flexibility
            return jsonify({
                "file_url": file_url,
                "absolute_url": absolute_url,
                "original_filename": original_filename,
                "filename": final_filename
            })
            
        except Exception as e:
            debug_log(f"Error saving uploaded file: {str(e)}")
            return jsonify({"error": str(e)}), 500

    # Removed the /full endpoint as it's not needed and was causing errors

    @dogs_bp.route("/<int:dog_id>/associate-puppy/<int:puppy_id>", methods=["POST"])
    def associate_dog_with_puppy(dog_id, puppy_id):
        """Associate a dog with its puppy record"""
        try:
            debug_log(f"Associating dog ID {dog_id} with puppy ID {puppy_id}")
            
            # Check if dog exists
            dog = db.get("dogs", dog_id)
            if not dog:
                debug_log(f"Dog with ID {dog_id} not found")
                return jsonify({"error": f"Dog with ID {dog_id} not found"}), 404
            
            # Check if puppy exists
            puppy = db.get("puppies", puppy_id)
            if not puppy:
                debug_log(f"Puppy with ID {puppy_id} not found")
                return jsonify({"error": f"Puppy with ID {puppy_id} not found"}), 404
            
            # First check if the column exists in the database
            try:
                # Try to directly execute a query to check if the column exists
                debug_log("Checking if puppy_id column exists in dogs table")
                check_column = db.supabase.table("dogs").select("puppy_id").limit(1).execute()
                debug_log(f"Column check result: {check_column}")
                
                # If we get here, the column exists, so update using puppy_id
                updated_dog = db.update("dogs", dog_id, {"puppy_id": puppy_id})
                field_used = "puppy_id"
            except Exception as column_error:
                debug_log(f"Error with puppy_id column: {str(column_error)}")
                
                # Try alternative field names based on schema
                try:
                    debug_log("Attempting to use litter_id as alternative")
                    # Get the litter_id from the puppy record
                    litter_id = puppy.get("litter_id")
                    if litter_id:
                        updated_dog = db.update("dogs", dog_id, {"litter_id": litter_id})
                        field_used = "litter_id"
                    else:
                        return jsonify({"error": "Puppy has no litter_id to associate with"}), 400
                except Exception as alt_error:
                    debug_log(f"Error with alternative field: {str(alt_error)}")
                    return jsonify({
                        "error": "Could not find appropriate field in dogs table for puppy association",
                        "details": str(alt_error)
                    }), 500
            
            # Return success response
            response = jsonify({
                "message": f"Dog ID {dog_id} successfully associated with Puppy ID {puppy_id} using field {field_used}",
                "dog": updated_dog
            })
            return response, 200
            
        except Exception as e:
            debug_log(f"Error associating dog with puppy: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @dogs_bp.route("/<int:dog_id>/disassociate-puppy", methods=["POST"])
    def disassociate_dog_from_puppy(dog_id):
        """Remove the association between a dog and its puppy record"""
        try:
            debug_log(f"Disassociating dog ID {dog_id} from puppy record")
            
            # Check if dog exists
            dog = db.get("dogs", dog_id)
            if not dog:
                debug_log(f"Dog with ID {dog_id} not found")
                return jsonify({"error": f"Dog with ID {dog_id} not found"}), 404
            
            # Update the dog record to remove the puppy_id
            updated_dog = db.update("dogs", dog_id, {"puppy_id": None})
            
            # Return success response
            response = jsonify({
                "message": f"Dog ID {dog_id} successfully disassociated from puppy record",
                "dog": updated_dog
            })
            return response, 200
            
        except Exception as e:
            debug_log(f"Error disassociating dog from puppy: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @dogs_bp.route("/<int:dog_id>/with-puppy-history", methods=["GET"])
    def get_dog_with_puppy_history(dog_id):
        """Get a dog with its associated puppy information"""
        try:
            debug_log(f"Fetching dog ID {dog_id} with puppy history")
            
            # Check if dog exists
            dog = db.get("dogs", dog_id)
            if not dog:
                debug_log(f"Dog with ID {dog_id} not found")
                return jsonify({"error": f"Dog with ID {dog_id} not found"}), 404
            
            # Create a response object that includes the dog data
            response_data = {**dog}
            
            # If the dog has a puppy_id, include puppy information
            if dog.get('puppy_id'):
                debug_log(f"Fetching puppy with ID: {dog['puppy_id']}")
                puppy = db.get("puppies", dog['puppy_id'])
                if not puppy:
                    debug_log(f"Puppy with ID {dog['puppy_id']} not found")
                    response_data['puppy_info'] = {"error": "Puppy record not found"}
                else:
                    # Add puppy information
                    response_data['puppy_info'] = puppy
                    
                    # If the puppy has a litter_id, include litter information
                    if puppy.get('litter_id'):
                        litter = db.get("litters", puppy['litter_id'])
                        if not litter:
                            debug_log(f"Litter with ID {puppy['litter_id']} not found")
                            response_data['birth_litter'] = {"error": "Litter record not found"}
                        else:
                            response_data['birth_litter'] = litter
            
            # Return the enhanced dog data
            response = jsonify(response_data)
            return response, 200
            
        except Exception as e:
            debug_log(f"Error fetching dog with puppy history: {str(e)}")
            return jsonify({"error": str(e)}), 500

    return dogs_bp
