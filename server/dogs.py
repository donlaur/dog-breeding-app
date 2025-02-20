"""
dogs.py

This module defines the Blueprint for all dog-related endpoints.
It includes endpoints to get, create, update, delete dog records, and handle file uploads.
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from server.supabase_client import supabase

dogs_bp = Blueprint("dogs_bp", __name__)

# -----------------------------------------------------------------------------
# Helper Functions for Silent Numeric Parsing
# -----------------------------------------------------------------------------

def parse_int_field_silent(form, field):
    """
    Convert the value in 'form[field]' to an integer.
    If the value is empty ("" or "null") or cannot be parsed, set it to None.
    """
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
    """
    Convert the value in 'form[field]' to a float.
    If the value is empty ("" or "null") or cannot be parsed, set it to None.
    """
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
    """
    Convert JSON value for field to int, or set to None if empty or invalid.
    """
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
    """
    Convert JSON value for field to float, or set to None if empty or invalid.
    """
    if field in data:
        val = str(data[field]).strip().lower()
        if val in ("", "null"):
            data[field] = None
        else:
            try:
                data[field] = float(val)
            except ValueError:
                data[field] = None

# -----------------------------------------------------------------------------
# GET Endpoints
# -----------------------------------------------------------------------------

@dogs_bp.route("/", methods=["GET"])
def get_all_dogs():
    """
    Retrieve all dog records from Supabase.
    """
    response = supabase.table("dogs").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@dogs_bp.route("/<int:dog_id>", methods=["GET"])
def get_dog_by_id(dog_id):
    """
    Retrieve a single dog record by ID.
    """
    response = supabase.table("dogs").select("*").eq("id", dog_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    dogs = rdict.get("data") or []
    if not dogs:
        return jsonify({"error": "Dog not found"}), 404
    return jsonify(dogs[0])

# -----------------------------------------------------------------------------
# POST Endpoint: Create or Update Dog
# -----------------------------------------------------------------------------

@dogs_bp.route("/", methods=["POST"])
def create_or_update_dog():
    """
    Create a new dog record or update an existing one.
    
    If a query parameter 'dog_id' is provided, the corresponding record is updated.
    This endpoint supports both multipart/form-data (for file uploads) and JSON.
    Numeric fields (breed_id, sire_id, dam_id, weight) are silently parsed:
    empty or invalid values are converted to None.
    """
    dog_id = request.args.get("dog_id")
    content_type = request.content_type or ""

    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]

        # Process birth_date; if invalid, set to None.
        if "birth_date" in form_data and form_data["birth_date"]:
            try:
                dt = datetime.strptime(form_data["birth_date"], "%Y-%m-%d")
                form_data["birth_date"] = dt.strftime("%Y-%m-%d")
            except ValueError:
                form_data["birth_date"] = None

        # Silently parse numeric fields.
        parse_int_field_silent(form_data, "breed_id")
        parse_int_field_silent(form_data, "sire_id")
        parse_int_field_silent(form_data, "dam_id")
        parse_float_field_silent(form_data, "weight")

        # Handle cover photo upload.
        file = request.files.get("cover_photo")
        if file:
            original_filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())[:8]
            final_filename = f"{unique_id}_{original_filename}"
            filepath = f"dog_images/{final_filename}"
            form_data["cover_photo_original_filename"] = original_filename

            # Save file temporarily before uploading.
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                file.save(tmp.name)
                tmp_path = tmp.name

            try:
                upload_response = supabase.storage.from_("uploads").upload(filepath, tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

            upload_dict = upload_response.dict()
            if upload_dict.get("error"):
                return jsonify({"error": upload_dict["error"]["message"]}), 400

            form_data["cover_photo"] = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"

        # Insert or update record.
        if dog_id:
            update_response = supabase.table("dogs").update(form_data).eq("id", int(dog_id)).execute()
            update_dict = update_response.dict()
            if update_dict.get("error"):
                return jsonify({"error": update_dict["error"]["message"]}), 400
            updated = update_dict.get("data") or []
            return jsonify(updated[0] if updated else {}), 200
        else:
            insert_response = supabase.table("dogs").insert(form_data).execute()
            insert_dict = insert_response.dict()
            if insert_dict.get("error"):
                return jsonify({"error": insert_dict["error"]["message"]}), 400
            inserted = insert_dict.get("data") or []
            return jsonify(inserted[0] if inserted else {}), 201

    else:
        # JSON approach.
        data = request.get_json() or {}
        parse_int_field_silent_json(data, "breed_id")
        parse_int_field_silent_json(data, "sire_id")
        parse_int_field_silent_json(data, "dam_id")
        parse_float_field_silent_json(data, "weight")

        if dog_id:
            update_response = supabase.table("dogs").update(data).eq("id", int(dog_id)).execute()
            update_dict = update_response.dict()
            if update_dict.get("error"):
                return jsonify({"error": update_dict["error"]["message"]}), 400
            updated = update_dict.get("data") or []
            return jsonify(updated[0] if updated else {}), 200
        else:
            insert_response = supabase.table("dogs").insert(data).execute()
            insert_dict = insert_response.dict()
            if insert_dict.get("error"):
                return jsonify({"error": insert_dict["error"]["message"]}), 400
            inserted = insert_dict.get("data") or []
            return jsonify(inserted[0] if inserted else {}), 201

# -----------------------------------------------------------------------------
# DELETE Endpoint: Delete Dog
# -----------------------------------------------------------------------------

@dogs_bp.route("/<int:dog_id>", methods=["DELETE"])
def delete_dog(dog_id):
    """
    Delete a dog record by its ID.
    
    This endpoint should be called only after user confirmation on the front end.
    """
    response = supabase.table("dogs").delete().eq("id", dog_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify({"message": "Dog deleted successfully"}), 200

# -----------------------------------------------------------------------------
# Optional File Upload Endpoint
# -----------------------------------------------------------------------------

@dogs_bp.route("/upload", methods=["POST"])
def upload_file():
    """
    A separate endpoint for direct file uploads.
    This is optional and can be used if you need to upload files outside the dog form.
    """
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

    u_dict = upload_response.dict()
    if u_dict.get("error"):
        return jsonify({"error": u_dict["error"]["message"]}), 400

    file_url = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"
    return jsonify({"file_url": file_url})
