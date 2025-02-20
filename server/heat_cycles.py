# server/heat_cycles.py
import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from server.supabase_client import supabase

load_dotenv()

heat_bp = Blueprint("heat_bp", __name__)

# GET all heat cycle records (optionally filter by dog_id)
@heat_bp.route("/", methods=["GET"])
def get_heat_cycles():
    dog_id = request.args.get("dog_id")
    query = supabase.table("heat_cycles").select("*")
    if dog_id:
        try:
            query = query.eq("dog_id", int(dog_id))
        except ValueError:
            return jsonify({"error": "Invalid dog_id parameter"}), 400
    response = query.execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 500
    return jsonify(rdict.get("data") or [])

# GET a single heat cycle record by its ID
@heat_bp.route("/<int:cycle_id>", methods=["GET"])
def get_heat_cycle(cycle_id):
    response = supabase.table("heat_cycles").select("*").eq("id", cycle_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 500
    cycles = rdict.get("data") or []
    if not cycles:
        return jsonify({"error": "Heat cycle not found"}), 404
    return jsonify(cycles[0])

# POST – Create a new heat cycle record
@heat_bp.route("/", methods=["POST"])
def create_heat_cycle():
    data = request.get_json() or {}
    # Parse date fields; if invalid, set to None.
    for field in ["start_date", "end_date", "mating_date", "expected_whelp_date", "actual_whelp_date"]:
        if field in data and data[field] != "":
            try:
                dt = datetime.strptime(data[field], "%Y-%m-%d")
                data[field] = dt.strftime("%Y-%m-%d")
            except ValueError:
                data[field] = None
        else:
            data[field] = None

    response = supabase.table("heat_cycles").insert(data).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 500
    inserted = rdict.get("data") or []
    return jsonify(inserted[0] if inserted else {}), 201

# PUT – Update an existing heat cycle record
@heat_bp.route("/<int:cycle_id>", methods=["PUT"])
def update_heat_cycle(cycle_id):
    data = request.get_json() or {}
    for field in ["start_date", "end_date", "mating_date", "expected_whelp_date", "actual_whelp_date"]:
        if field in data and data[field] != "":
            try:
                dt = datetime.strptime(data[field], "%Y-%m-%d")
                data[field] = dt.strftime("%Y-%m-%d")
            except ValueError:
                data[field] = None
        else:
            data[field] = None

    response = supabase.table("heat_cycles").update(data).eq("id", cycle_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 500
    updated = rdict.get("data") or []
    return jsonify(updated[0] if updated else {}), 200

# DELETE – Delete a heat cycle record
@heat_bp.route("/<int:cycle_id>", methods=["DELETE"])
def delete_heat_cycle(cycle_id):
    response = supabase.table("heat_cycles").delete().eq("id", cycle_id).execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 500
    return jsonify({"message": "Heat cycle deleted successfully"}), 200
