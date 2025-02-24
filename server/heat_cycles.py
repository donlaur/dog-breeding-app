"""
heat_cycles.py

Blueprint for managing heat cycle records.
"""

from flask import Blueprint, request, jsonify
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_heat_cycles_bp(db: DatabaseInterface) -> Blueprint:
    heat_cycles_bp = Blueprint("heat_cycles_bp", __name__)

    @heat_cycles_bp.route("/", methods=["GET"])
    def get_heat_cycles():
        debug_log("Fetching all heat cycles...")
        try:
            cycles = db.get_all("heat_cycles")
            debug_log(f"Found {len(cycles)} heat cycles")
            return jsonify(cycles)
        except DatabaseError as e:
            debug_log(f"Error fetching heat cycles: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @heat_cycles_bp.route("/<int:cycle_id>", methods=["GET"])
    def get_heat_cycle(cycle_id):
        debug_log(f"Fetching heat cycle with ID: {cycle_id}")
        try:
            cycle = db.get_by_id("heat_cycles", cycle_id)
            if not cycle:
                debug_log(f"Heat cycle {cycle_id} not found")
                return jsonify({"error": "Heat cycle not found"}), 404
            debug_log(f"Found heat cycle: {cycle}")
            return jsonify(cycle)
        except DatabaseError as e:
            debug_log(f"Error fetching heat cycle: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @heat_cycles_bp.route("/", methods=["POST"])
    def create_heat_cycle():
        try:
            data = request.get_json()
            cycle = db.create("heat_cycles", data)
            return jsonify(cycle), 201
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_cycles_bp.route("/<int:cycle_id>", methods=["PUT"])
    def update_heat_cycle(cycle_id):
        try:
            data = request.get_json()
            cycle = db.update("heat_cycles", cycle_id, data)
            return jsonify(cycle)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_cycles_bp.route("/<int:cycle_id>", methods=["DELETE"])
    def delete_heat_cycle(cycle_id):
        try:
            db.delete("heat_cycles", cycle_id)
            return jsonify({"message": "Heat cycle deleted successfully"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    return heat_cycles_bp
