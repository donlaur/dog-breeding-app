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
        debug_log("Fetching all dogs...")
        try:
            # Include timestamp fields in the query
            response = db.supabase.table("dogs").select(
                "id",
                "call_name",
                "registered_name",
                "breed_id",
                "gender",
                "color",
                "is_adult",
                "birth_date",
                "cover_photo",
                "status",
                "created_at",
                "updated_at"
            ).order("created_at.desc").execute()
            
            dogs = response.data if response else []
            debug_log(f"Found {len(dogs)} dogs")
            
            # Add CORS headers
            response = make_response(jsonify(dogs))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching dogs: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["GET"])
    def get_dog(dog_id):
        debug_log(f"Fetching dog with ID: {dog_id}")
        try:
            response = db.supabase.table("dogs").select(
                "id",
                "call_name",
                "registered_name",
                "breed_id",
                "gender",
                "color",
                "is_adult",
                "birth_date",
                "cover_photo",
                "status",
                "description",
                "notes",
                "markings",
                "microchip",
                "registration_type",
                "program_id",
                "litter_id",
                "created_at",
                "updated_at"
            ).eq("id", dog_id).single().execute()
            
            if not response.data:
                debug_log(f"No dog found with ID: {dog_id}")
                return jsonify({"error": "Dog not found"}), 404
                
            dog = response.data
            debug_log(f"Found dog: {dog}")
            
            # Add CORS headers
            response = make_response(jsonify(dog))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching dog: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/", methods=["POST"])
    def create_dog():
        try:
            data = request.get_json()
            # created_at and updated_at will be set automatically by the database
            dog = db.create("dogs", data)
            
            # Return the created dog with timestamps
            response = make_response(jsonify({
                **dog,
                "message": "Dog created successfully",
                "timestamp": datetime.utcnow().isoformat()
            }), 201)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            return response
            
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["PUT"])
    def update_dog(dog_id):
        try:
            data = request.get_json()
            # updated_at will be set automatically by the database trigger
            dog = db.update("dogs", dog_id, data)
            
            response = make_response(jsonify({
                **dog,
                "message": "Dog updated successfully",
                "timestamp": datetime.utcnow().isoformat()
            }))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            return response
            
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/", methods=["DELETE"])
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
