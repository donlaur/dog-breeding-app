"""
breeds.py

Blueprint for breed-related endpoints, including:
- Retrieving all dog breeds
- Retrieving the breeding program details
- (Optionally) retrieving litters data
"""

from flask import Blueprint, jsonify
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface

def create_breeds_bp(db: DatabaseInterface) -> Blueprint:
    breeds_bp = Blueprint("breeds_bp", __name__)

    @breeds_bp.route("/", methods=["GET"])
    def get_all_breeds():
        try:
            breeds = db.get_all("dog_breeds")
            return jsonify(breeds)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @breeds_bp.route("/program", methods=["GET"])
    def get_breeding_program():
        try:
            filters = {"name": "Laur's Classic Corgis"}
            programs = db.get_filtered("breeding_programs", filters)
            return jsonify(programs[0] if programs else {"error": "Breeding program not found"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @breeds_bp.route("/litters", methods=["GET"])
    def get_litters():
        try:
            litters = db.get_all("litters")
            return jsonify(litters)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    return breeds_bp
