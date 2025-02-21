"""
routes.py

This module defines the Flask API endpoints for the Dog Breeding App.
It handles retrieving dog, breed, and related records from Supabase,
as well as creating, updating, and deleting dog records, handling file uploads,
updating litter records, and creating puppies for a litter.
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
    response = supabase.table("dogs").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/dogs/<int:dog_id>", methods=["GET"])
def get_dog_by_id(dog_id):
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
    response = supabase.table("dog_breeds").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/breeder-program", methods=["GET"])
def get_breeder_program():
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
    response = supabase.table("litters").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

# GET a single litter (with puppies embedded)
@main_bp.route("/api/litters/<int:litter_id>", methods=["GET"])
def get_litter_by_id(litter_id):
    response = supabase.table("litters").select("*, puppies:dogs!dogs_litter_id_fkey(*)").eq("id", litter_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    data = rdict.get("data") or []
    if not data:
        return jsonify({"error": "Litter not found"}), 404
    return jsonify(data[0])

@main_bp.route("/api/messages", methods=["GET"])
def get_messages():
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
    dog_id = request.args.get("dog_id")
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]
        if "birth_date" in form_data and form_data["birth_date"]:
            try:
                dt = datetime.strptime(form_data["birth_date"], "%Y-%m-%d")
                form_data["birth_date"] = dt.strftime("%Y-%m-%d")
            except ValueError:
                form_data["birth_date"] = None
        parse_int_field_silent(form_data, "breed_id")
        parse_int_field_silent(form_data, "sire_id")
        parse_int_field_silent(form_data, "dam_id")
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
            upload_dict = upload_response.dict()
            if upload_dict.get("error"):
                return jsonify({"error": upload_dict["error"]["message"]}), 400
            form_data["cover_photo"] = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"
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
# POST Endpoint: Create a New Litter
# -----------------------------------------------------------------------------

@main_bp.route("/api/litters", methods=["POST"])
def create_litter():
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]

        # Convert empty or invalid date fields to None
        for date_field in ["birth_date", "expected_date", "planned_date"]:
            if date_field in form_data:
                if form_data[date_field] == "":
                    form_data[date_field] = None
                elif form_data[date_field]:
                    try:
                        dt = datetime.strptime(form_data[date_field], "%Y-%m-%d")
                        form_data[date_field] = dt.strftime("%Y-%m-%d")
                    except ValueError:
                        form_data[date_field] = None

        parse_int_field_silent(form_data, "breed_id")
        parse_int_field_silent(form_data, "sire_id")
        parse_int_field_silent(form_data, "dam_id")
        parse_float_field_silent(form_data, "price")
        parse_float_field_silent(form_data, "deposit")

        file = request.files.get("cover_photo")
        if file:
            original_filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())[:8]
            final_filename = f"{unique_id}_{original_filename}"
            filepath = f"litter_images/{final_filename}"
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

        insert_response = supabase.table("litters").insert(form_data).execute()
        i_dict = insert_response.dict()
        if i_dict.get("error"):
            return jsonify({"error": i_dict["error"]["message"]}), 400
        inserted = i_dict.get("data") or []
        return jsonify(inserted[0] if inserted else {}), 201

    else:
        data = request.get_json() or {}
        # Convert empty or invalid date fields to None
        for date_field in ["birth_date", "expected_date", "planned_date"]:
            if date_field in data:
                if data[date_field] == "":
                    data[date_field] = None
                elif data[date_field]:
                    try:
                        dt = datetime.strptime(data[date_field], "%Y-%m-%d")
                        data[date_field] = dt.strftime("%Y-%m-%d")
                    except ValueError:
                        data[date_field] = None

        parse_int_field_silent_json(data, "breed_id")
        parse_int_field_silent_json(data, "sire_id")
        parse_int_field_silent_json(data, "dam_id")
        parse_float_field_silent_json(data, "price")
        parse_float_field_silent_json(data, "deposit")

        insert_response = supabase.table("litters").insert(data).execute()
        i_dict = insert_response.dict()
        if i_dict.get("error"):
            return jsonify({"error": i_dict["error"]["message"]}), 400
        inserted = i_dict.get("data") or []
        return jsonify(inserted[0] if inserted else {}), 201

# -----------------------------------------------------------------------------
# PUT Endpoint: Update Litter (Empty date fix here)
# -----------------------------------------------------------------------------

@main_bp.route("/api/litters/<int:litter_id>", methods=["PUT"])
def update_litter(litter_id):
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]

        # Convert empty or invalid date fields to None
        for date_field in ["birth_date", "expected_date", "planned_date"]:
            if date_field in form_data:
                if form_data[date_field] == "":
                    form_data[date_field] = None
                elif form_data[date_field]:
                    try:
                        dt = datetime.strptime(form_data[date_field], "%Y-%m-%d")
                        form_data[date_field] = dt.strftime("%Y-%m-%d")
                    except ValueError:
                        form_data[date_field] = None

        parse_int_field_silent(form_data, "breed_id")
        parse_int_field_silent(form_data, "sire_id")
        parse_int_field_silent(form_data, "dam_id")
        parse_float_field_silent(form_data, "price")
        parse_float_field_silent(form_data, "deposit")

        update_response = supabase.table("litters").update(form_data).eq("id", litter_id).execute()
        u_dict = update_response.dict()
        if u_dict.get("error"):
            return jsonify({"error": u_dict["error"]["message"]}), 400
        updated = u_dict.get("data") or []
        return jsonify(updated[0] if updated else {}), 200

    else:
        data = request.get_json() or {}
        # Convert empty or invalid date fields to None
        for date_field in ["birth_date", "expected_date", "planned_date"]:
            if date_field in data:
                if data[date_field] == "":
                    data[date_field] = None
                elif data[date_field]:
                    try:
                        dt = datetime.strptime(data[date_field], "%Y-%m-%d")
                        data[date_field] = dt.strftime("%Y-%m-%d")
                    except ValueError:
                        data[date_field] = None

        parse_int_field_silent_json(data, "breed_id")
        parse_int_field_silent_json(data, "sire_id")
        parse_int_field_silent_json(data, "dam_id")
        parse_float_field_silent_json(data, "price")
        parse_float_field_silent_json(data, "deposit")

        update_response = supabase.table("litters").update(data).eq("id", litter_id).execute()
        u_dict = update_response.dict()
        if u_dict.get("error"):
            return jsonify({"error": u_dict["error"]["message"]}), 400
        updated = u_dict.get("data") or []
        return jsonify(updated[0] if updated else {}), 200

# -----------------------------------------------------------------------------
# New Endpoint: Create a Puppy in a Specific Litter
# -----------------------------------------------------------------------------

@main_bp.route("/api/litters/<int:litter_id>/puppies", methods=["POST"])
def create_puppy_in_litter(litter_id):
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
            upload_dict = upload_response.dict()
            if upload_dict.get("error"):
                return jsonify({"error": upload_dict["error"]["message"]}), 400
            form_data["cover_photo"] = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"
        insert_response = supabase.table("dogs").insert(form_data).execute()
        insert_dict = insert_response.dict()
        if insert_dict.get("error"):
            return jsonify({"error": insert_dict["error"]["message"]}), 400
        inserted = insert_dict.get("data") or []
        return jsonify(inserted[0] if inserted else {}), 201
    else:
        data = request.get_json() or {}
        data["litter_id"] = litter_id
        parse_int_field_silent_json(data, "breed_id")
        parse_float_field_silent_json(data, "weight")
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
