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
dogs = db.find_by_field_values("dogs")
            
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

    return dogs_bp
