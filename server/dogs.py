"""
dogs.py

Blueprint for all dog-related endpoints (CRUD + file uploads).
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from server.supabase_client import supabase
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface

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
    def get_all_dogs():
        try:
            dogs = db.get_all("dogs")
            return jsonify(dogs)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @dogs_bp.route("/<int:dog_id>", methods=["GET"])
    def get_dog(dog_id):
        try:
            dog = db.get_by_id("dogs", dog_id)
            if not dog:
                return jsonify({"error": "Dog not found"}), 404
            return jsonify(dog)
        except DatabaseError as e:
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

    return dogs_bp
