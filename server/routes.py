"""
routes.py

This module defines the Flask API endpoints for the Dog Breeding App.
It handles retrieving dog, breed, and related records from Supabase,
as well as creating, updating, deleting dog records and handling file uploads.

Key Design Decisions:
- Numeric fields (e.g., breed_id, sire_id, dam_id, weight) are parsed silently.
  Empty or invalid input is converted to None to prevent database errors.
- File uploads are handled using a temporary file and then uploaded to Supabase Storage
  with a unique filename generated via UUID.
- APIResponse objects from Supabase are converted to dictionaries using `.dict()`
  so that errors and data can be inspected reliably.
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv
from server.supabase_client import supabase

# Load environment variables from .env file
load_dotenv()

# Create a Blueprint for main endpoints
main_bp = Blueprint("main_bp", __name__)

# Construct the Supabase domain from the URL for public file URLs.
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_DOMAIN = SUPABASE_URL.split("://")[-1] if SUPABASE_URL else "your-project-id.supabase.co"

# -----------------------------------------------------------------------------
# Helper Functions for Numeric Parsing
# -----------------------------------------------------------------------------

def parse_int_field_silent(form, field):
    """
    Convert a field in the form (string) to an integer.
    If the field is empty ("" or "null") or invalid, set it to None.
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
    Convert a field in the form (string) to a float.
    If the field is empty ("" or "null") or invalid, set it to None.
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
    Similar to parse_int_field_silent but for JSON data.
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
    Similar to parse_float_field_silent but for JSON data.
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

@main_bp.route("/api/dogs", methods=["GET"])
def get_all_dogs():
    """Retrieve all dog records from the database."""
    response = supabase.table("dogs").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/dogs/<int:dog_id>", methods=["GET"])
def get_dog_by_id(dog_id):
    """Retrieve a single dog record by its ID."""
    response = supabase.table("dogs").select("*").eq("id", dog_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    dogs = rdict.get("data") or []
    if not dogs:
        return jsonify({"error": "Dog not found"}), 404
    return jsonify(dogs[0])

@main_bp.route("/api/breeds", methods=["GET"])
def get_breeds():
    """Retrieve all dog breeds from the database."""
    response = supabase.table("dog_breeds").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/breeder-program", methods=["GET"])
def get_breeder_program():
    """
    Retrieve the breeding program with the name "Laur's Classic Corgis".
    Returns an error if not found.
    """
    response = (
        supabase.table("breeding_programs")
        .select("*")
        .eq("name", "Laur's Classic Corgis")
        .limit(1)
        .execute()
    )
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    data = rdict.get("data") or []
    return jsonify(data[0] if data else {"error": "Breeding program not found"})

@main_bp.route("/api/litters", methods=["GET"])
def get_litters():
    """Retrieve all litter records from the database."""
    response = supabase.table("litters").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/messages", methods=["GET"])
def get_messages():
    """Retrieve all contact messages from the database."""
    response = supabase.table("contact_messages").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

# -----------------------------------------------------------------------------
# POST Endpoint: Create or Update Dog
# -----------------------------------------------------------------------------

@main_bp.route("/api/dogs", methods=["POST"])
def create_or_update_dog():
    """
    Create a new dog record or update an existing one.
    
    - If the query parameter 'dog_id' is provided, update the record with that ID.
    - Accepts both multipart/form-data (for file uploads) and JSON.
    - Numeric fields (breed_id, sire_id, dam_id, weight) are parsed silently;
      empty or invalid input is converted to None.
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

        # Handle file upload for cover_photo.
        file = request.files.get("cover_photo")
        if file:
            original_filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())[:8]
            final_filename = f"{unique_id}_{original_filename}"
            filepath = f"dog_images/{final_filename}"
            form_data["cover_photo_original_filename"] = original_filename

            # Save file to a temporary file, then upload to Supabase Storage.
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

        # Insert or update the dog record.
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

@main_bp.route("/api/dogs/<int:dog_id>", methods=["DELETE"])
def delete_dog(dog_id):
    """
    Delete a dog record by its ID.
    
    This endpoint is called after user confirmation on the front end.
    """
    response = supabase.table("dogs").delete().eq("id", dog_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify({"message": "Dog deleted successfully"}), 200

# -----------------------------------------------------------------------------
# File Upload Endpoint (Optional)
# -----------------------------------------------------------------------------

@main_bp.route("/api/upload", methods=["POST"])
def upload_file():
    """
    A separate endpoint for direct file uploads.
    This is optional and primarily used if you need to upload files outside of the dog form.
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
