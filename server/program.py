# server/program.py

"""
program.py

Blueprint for managing breeding program details.
"""

import os
from flask import Blueprint, jsonify, request, make_response
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface
from server.config import debug_log

def create_program_bp(db: DatabaseInterface) -> Blueprint:
    program_bp = Blueprint("program_bp", __name__)

    @program_bp.route("/", methods=["GET", "OPTIONS"])
    def get_breeder_program():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type")
            response.headers.add("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
            return response

        debug_log("Fetching program data...")
        try:
            filters = {"name": "Laur's Classic Corgis"}
            programs = db.get_filtered("breeding_programs", filters)
            debug_log(f"Found programs: {programs}")
            if not programs:
                return jsonify({"error": "Breeding program not found"}), 404
            return jsonify(programs[0])
        except DatabaseError as e:
            debug_log(f"Database error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @program_bp.route("/", methods=["PUT", "OPTIONS"])
    def update_breeder_program():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type")
            response.headers.add("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
            return response

        try:
            data = request.get_json()
            filters = {"name": "Laur's Classic Corgis"}
            programs = db.get_filtered("breeding_programs", filters)
            if not programs:
                return jsonify({"error": "Program not found"}), 404
            
            program = db.update("breeding_programs", programs[0]["id"], data)
            return jsonify(program)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    return program_bp
