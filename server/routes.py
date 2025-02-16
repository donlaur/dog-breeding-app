import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv
from server.supabase_client import supabase

load_dotenv()

main_bp = Blueprint("main_bp", __name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_DOMAIN = SUPABASE_URL.split("://")[-1] if SUPABASE_URL else "your-project-id.supabase.co"

@main_bp.route("/api/dogs", methods=["GET"])
def get_all_dogs():
    response = supabase.table("dogs").select("*").execute()
    rdict = response.dict()
    err = rdict.get("error")  # safe fetch
    if err:
        return jsonify({"error": err["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/dogs/<int:dog_id>", methods=["GET"])
def get_dog_by_id(dog_id):
    response = supabase.table("dogs").select("*").eq("id", dog_id).execute()
    rdict = response.dict()
    err = rdict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400
    
    dogs = rdict.get("data") or []
    if not dogs:
        return jsonify({"error": "Dog not found"}), 404
    return jsonify(dogs[0])

@main_bp.route("/api/breeds", methods=["GET"])
def get_breeds():
    response = supabase.table("dog_breeds").select("*").execute()
    rdict = response.dict()
    err = rdict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400
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
    err = rdict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400

    data = rdict.get("data") or []
    return jsonify(data[0] if data else {"error": "Breeding program not found"})

@main_bp.route("/api/litters", methods=["GET"])
def get_litters():
    response = supabase.table("litters").select("*").execute()
    rdict = response.dict()
    err = rdict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/messages", methods=["GET"])
def get_messages():
    response = supabase.table("contact_messages").select("*").execute()
    rdict = response.dict()
    err = rdict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400
    return jsonify(rdict.get("data") or [])

@main_bp.route("/api/dogs", methods=["POST"])
def create_dog():
    content_type = request.content_type or ""
    if content_type.startswith("multipart/form-data"):
        form_data = {}
        for key in request.form:
            form_data[key] = request.form[key]

        if "birth_date" in form_data:
            try:
                dt = datetime.strptime(form_data["birth_date"], "%Y-%m-%d")
                form_data["birth_date"] = dt.strftime("%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Invalid date format"}), 400

        if "breed_id" in form_data:
            try:
                form_data["breed_id"] = int(form_data["breed_id"])
            except ValueError:
                return jsonify({"error": "Invalid breed_id"}), 400

        file = request.files.get("cover_photo")
        if file:
            filename = secure_filename(file.filename)
            filepath = f"dog_images/{filename}"
            upload_response = supabase.storage.from_("uploads").upload(filepath, file)
            upload_dict = upload_response.dict()
            err = upload_dict.get("error")
            if err:
                return jsonify({"error": err["message"]}), 400
            
            form_data["cover_photo"] = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"

        insert_response = supabase.table("dogs").insert(form_data).execute()
        i_dict = insert_response.dict()
        err = i_dict.get("error")
        if err:
            return jsonify({"error": err["message"]}), 400

        inserted = i_dict.get("data") or []
        return jsonify(inserted[0] if inserted else {}), 201
    else:
        data = request.get_json() or {}
        insert_response = supabase.table("dogs").insert(data).execute()
        i_dict = insert_response.dict()
        err = i_dict.get("error")
        if err:
            return jsonify({"error": err["message"]}), 400

        inserted = i_dict.get("data") or []
        return jsonify(inserted[0] if inserted else {}), 201

@main_bp.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename)
    filepath = f"dog_images/{filename}"
    upload_response = supabase.storage.from_("uploads").upload(filepath, file)
    u_dict = upload_response.dict()
    err = u_dict.get("error")
    if err:
        return jsonify({"error": err["message"]}), 400

    file_url = f"https://{SUPABASE_DOMAIN}/storage/v1/object/public/uploads/{filepath}"
    return jsonify({"file_url": file_url})
