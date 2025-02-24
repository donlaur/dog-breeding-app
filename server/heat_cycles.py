"""
heat_cycles.py

Blueprint for managing heat cycle records.
"""

from flask import Blueprint, request, jsonify
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface

def create_heat_bp(db: DatabaseInterface) -> Blueprint:
    heat_bp = Blueprint("heat_bp", __name__)

    @heat_bp.route("/", methods=["GET"])
    def get_heat_cycles():
        try:
            dog_id = request.args.get("dog_id")
            if dog_id:
                try:
                    filters = {"dog_id": int(dog_id)}
                    cycles = db.get_filtered("heat_cycles", filters)
                except ValueError:
                    return jsonify({"error": "Invalid dog_id parameter"}), 400
            else:
                cycles = db.get_all("heat_cycles")
            return jsonify(cycles)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_bp.route("/<int:cycle_id>", methods=["GET"])
    def get_heat_cycle(cycle_id):
        try:
            cycle = db.get_by_id("heat_cycles", cycle_id)
            if not cycle:
                return jsonify({"error": "Heat cycle not found"}), 404
            return jsonify(cycle)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_bp.route("/", methods=["POST"])
    def create_heat_cycle():
        try:
            data = request.get_json()
            cycle = db.create("heat_cycles", data)
            return jsonify(cycle), 201
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_bp.route("/<int:cycle_id>", methods=["PUT"])
    def update_heat_cycle(cycle_id):
        try:
            data = request.get_json()
            cycle = db.update("heat_cycles", cycle_id, data)
            return jsonify(cycle)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @heat_bp.route("/<int:cycle_id>", methods=["DELETE"])
    def delete_heat_cycle(cycle_id):
        try:
            db.delete("heat_cycles", cycle_id)
            return jsonify({"message": "Heat cycle deleted successfully"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    return heat_bp
