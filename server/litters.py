"""
litters.py

Blueprint for managing litters and associated puppies.
Puppies are stored in the 'dogs' table with a non-null 'litter_id'.
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_litters_bp(db: DatabaseInterface) -> Blueprint:
    litters_bp = Blueprint("litters_bp", __name__)

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

    @litters_bp.route("/", methods=["GET"])
    def get_litters():
        debug_log("Fetching all litters...")
        try:
            litters = db.get_all("litters")
            debug_log(f"Found {len(litters)} litters")
            return jsonify(litters)
        except DatabaseError as e:
            debug_log(f"Error fetching litters: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["GET"])
    def get_litter(litter_id):
        debug_log(f"Fetching litter with ID: {litter_id}")
        try:
            litter = db.get_by_id("litters", litter_id)
            if not litter:
                debug_log(f"Litter {litter_id} not found")
                return jsonify({"error": "Litter not found"}), 404
            debug_log(f"Found litter: {litter}")
            return jsonify(litter)
        except DatabaseError as e:
            debug_log(f"Error fetching litter: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/", methods=["POST"])
    def create_litter():
        try:
            data = request.get_json()
            litter = db.create("litters", data)
            return jsonify(litter), 201
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["PUT"])
    def update_litter(litter_id):
        try:
            data = request.get_json()
            litter = db.update("litters", litter_id, data)
            return jsonify(litter)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["DELETE"])
    def delete_litter(litter_id):
        try:
            db.delete("litters", litter_id)
            return jsonify({"message": "Litter deleted successfully"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>/puppies", methods=["POST"])
    def add_puppy_to_litter(litter_id):
        content_type = request.content_type or ""
        if content_type.startswith("multipart/form-data"):
            form_data = {}
            for key in request.form:
                form_data[key] = request.form[key]
            form_data["litter_id"] = litter_id
            if "birth_date" in form_data and form_data["birth_date"]:
                try:
                    dt = datetime.strptime(form_data["birth_date"], "%Y-%m-%d")
                    form_data["birth_date"] = dt.strftime("%Y-%m-%d")
                except ValueError:
                    form_data["birth_date"] = None
            parse_int_field_silent(form_data, "breed_id")
            parse_float_field_silent(form_data, "weight")
            file = request.files.get("cover_photo")
            if file:
                original_filename = secure_filename(file.filename)
                unique_id = str(uuid.uuid4())[:8]
                final_filename = f"{unique_id}_{original_filename}"
                filepath = f"dog_images/{final_filename}"
                form_data["cover_photo_original_filename"] = original_filename
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
                form_data["cover_photo"] = f"https://{os.getenv('SUPABASE_URL').split('://')[-1]}/storage/v1/object/public/uploads/{filepath}"
            insert_response = supabase.table("dogs").insert(form_data).execute()
            if insert_response.error:
                return jsonify({"error": insert_response.error.message}), 400
            inserted = insert_response.data or []
            return jsonify(inserted[0] if inserted else {}), 201
        else:
            data = request.get_json() or {}
            data["litter_id"] = litter_id
            parse_int_field_silent_json(data, "breed_id")
            parse_float_field_silent_json(data, "weight")
            insert_response = supabase.table("dogs").insert(data).execute()
            if insert_response.error:
                return jsonify({"error": insert_response.error.message}), 400
            inserted = insert_response.data or []
            return jsonify(inserted[0] if inserted else {}), 201

    return litters_bp
