"""
dogs.py

Blueprint for all dog-related endpoints (CRUD + file uploads).
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify, current_app
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
        debug_log("Fetching all dogs...")
        try:
            dogs = db.get_all("dogs")
            debug_log(f"Found {len(dogs)} dogs")
            return jsonify(dogs)
        except DatabaseError as e:
            debug_log(f"Error fetching dogs: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["GET", "PUT", "OPTIONS"])
    def get_or_update_dog(dog_id):
        """Get or update a specific dog."""
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            return '', 200
        
        if request.method == 'GET':
            debug_log(f"Fetching dog with ID: {dog_id}")
            try:
                dog = db.get_by_id("dogs", dog_id)
                
                if not dog:
                    debug_log(f"Dog with ID {dog_id} not found")
                    return jsonify({"error": "Dog not found"}), 404
                    
                debug_log(f"Found dog: {dog}")
                return jsonify(dog)
            except Exception as e:
                debug_log(f"Error fetching dog: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        elif request.method == 'PUT':
            debug_log(f"Updating dog with ID: {dog_id}")
            try:
                data = request.get_json()
                debug_log(f"Update data: {data}")
                
                # Update the dog record
                updated_dog = db.update("dogs", dog_id, data)
                
                if not updated_dog:
                    debug_log(f"Dog with ID {dog_id} not found for update")
                    return jsonify({"error": "Dog not found"}), 404
                    
                debug_log(f"Updated dog: {updated_dog}")
                return jsonify(updated_dog)
            except Exception as e:
                debug_log(f"Error updating dog: {str(e)}")
                return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/", methods=["POST"])
    def create_dog():
        try:
            data = request.get_json()
            dog = db.create("dogs", data)
            return jsonify(dog), 201
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["DELETE"])
    def delete_dog(dog_id):
        response = supabase.table("dogs").delete().eq("id", dog_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 400
        return jsonify({"message": "Dog deleted successfully"}), 200

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
            # Just get all basic dog data for now
            dogs = db.get_all("dogs")
            debug_log(f"Returning {len(dogs)} dogs with basic details")
            return jsonify(dogs)
        except DatabaseError as e:
            debug_log(f"Error fetching dogs with full details: {str(e)}")
            return jsonify({"error": str(e)}), 500

    return dogs_bp
