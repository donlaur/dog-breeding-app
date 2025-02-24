# server/program.py

"""
program.py

Blueprint for managing breeding program details.
"""

import os
from flask import Blueprint, jsonify, request
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface

def create_program_bp(db: DatabaseInterface) -> Blueprint:
    program_bp = Blueprint("program_bp", __name__)

    @program_bp.route("/", methods=["GET"])
    def get_breeder_program():
        try:
            filters = {"name": "Laur's Classic Corgis"}
            programs = db.get_filtered("breeding_programs", filters)
            return jsonify(programs[0] if programs else {"error": "Breeding program not found"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @program_bp.route("/", methods=["PUT"])
    def update_breeder_program():
        try:
            data = request.get_json()
            if not data.get("name"):
                return jsonify({"error": "Program name required"}), 400
            
            filters = {"name": data["name"]}
            programs = db.get_filtered("breeding_programs", filters)
            if not programs:
                return jsonify({"error": "Program not found"}), 404
            
            program = db.update("breeding_programs", programs[0]["id"], data)
            return jsonify(program)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    return program_bp
