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
            
            # Use the abstracted db interface
            dogs = db.find_by_field_values("dogs", {})
            
            debug_log(f"Found {len(dogs)} dogs")
            
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
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())[:8]
        final_filename = f"{unique_id}_{original_filename}"
        filepath = f"dog_images/{final_filename}"

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            upload_response = supabase.storage.from_("uploads").upload(filepath, tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        if upload_response.error:
            return jsonify({"error": upload_response.error.message}), 400

        file_url = f"https://{domain}/storage/v1/object/public/uploads/{filepath}"
        return jsonify({"file_url": file_url})

    @dogs_bp.route('/full', methods=['GET', 'OPTIONS'])
    def get_dogs_with_full_details():
        """Get all dogs with complete details for the current program."""
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            return '', 200
            
        debug_log("Fetching all dogs with full details...")
        try:
            # Enhanced query to get all relevant fields with correct column names
            response = db.supabase.table("dogs").select(
                "*",
                "breed:breed_id(id,breed_name)",
                "sire:sire_id(id,call_name,photo_url,birth_date)",
                "dam:dam_id(id,call_name,photo_url,birth_date)"
            ).execute()
            
            if response.error:
                raise DatabaseError(str(response.error))
                
            dogs = response.data
            debug_log(f"Returning {len(dogs)} dogs with full details")
            return jsonify(dogs)
        except DatabaseError as e:
            debug_log(f"Error fetching dogs with full details: {str(e)}")
            return jsonify({"error": str(e)}), 500

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
