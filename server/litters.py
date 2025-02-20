"""
litters.py

This module defines the Blueprint for managing litters and their associated puppies.
Puppies are stored in the 'dogs' table with a non-null 'litter_id'. This module includes:
  - GET endpoints to retrieve litters (and a single litter with embedded puppies)
  - POST endpoint to create a new litter (with new fields)
  - PUT endpoint to update an existing litter (with empty-date fix)
  - POST endpoint to add a puppy to a litter
  - DELETE endpoint to delete a litter
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from server.supabase_client import supabase

litters_bp = Blueprint("litters_bp", __name__)

# -----------------------------------------------------------------------------
# Helper Functions for Numeric Parsing
# -----------------------------------------------------------------------------

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

# -----------------------------------------------------------------------------
# GET Endpoints
# -----------------------------------------------------------------------------

@litters_bp.route("/", methods=["GET"])
def get_all_litters():
    response = supabase.table("litters").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@litters_bp.route("/<int:litter_id>", methods=["GET"])
def get_litter_by_id(litter_id):
    # Use explicit relationship name to embed associated puppies
    response = supabase.table("litters").select("*, puppies:dogs!dogs_litter_id_fkey(*)").eq("id", litter_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    data = rdict.get("data") or []
    if not data:
        return jsonify({"error": "Litter not found"}), 404
    return jsonify(data[0])

# -----------------------------------------------------------------------------
# POST Endpoint: Create a New Litter
# -----------------------------------------------------------------------------

@litters_bp.route("/", methods=["POST"])
def create_litter():
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]
        # Process date fields: if empty string, set to None
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
# PUT Endpoint: Update Litter
# -----------------------------------------------------------------------------

@litters_bp.route("/<int:litter_id>", methods=["PUT"])
def update_litter(litter_id):
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]
        # Process date fields
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
# POST Endpoint: Add a Puppy to a Specific Litter
# -----------------------------------------------------------------------------

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

@litters_bp.route("/<int:litter_id>", methods=["DELETE"])
def delete_litter(litter_id):
    response = supabase.table("litters").delete().eq("id", litter_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify({"message": "Litter deleted successfully"}), 200
