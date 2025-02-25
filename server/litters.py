"""
litters.py

Blueprint for managing litters and associated puppies.
Puppies are stored in the 'dogs' table with a non-null 'litter_id'.
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
from datetime import datetime
from server.database.supabase_db import SupabaseDatabase, DatabaseError
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_litters_bp(db: DatabaseInterface) -> Blueprint:
    litters_bp = Blueprint("litters_bp", __name__)

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

    @litters_bp.route("/", methods=["GET"])
    def get_litters():
        debug_log("Fetching all litters...")
        try:
            litters = db.get_all("litters")
            debug_log(f"Found {len(litters)} litters")
            return jsonify(litters)
        except DatabaseError as e:
            debug_log(f"Error fetching litters: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["GET"])
    def get_litter(litter_id):
        debug_log(f"Fetching litter with ID: {litter_id}")
        try:
            litter = db.get_by_id("litters", litter_id)
            if not litter:
                debug_log(f"Litter {litter_id} not found")
                return jsonify({"error": "Litter not found"}), 404
            debug_log(f"Found litter: {litter}")
            return jsonify(litter)
        except DatabaseError as e:
            debug_log(f"Error fetching litter: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/", methods=["POST"])
    def create_litter():
        try:
            data = request.get_json()
            litter = db.create("litters", data)
            return jsonify(litter), 201
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["PUT"])
    def update_litter(litter_id):
        try:
            data = request.get_json()
            litter = db.update("litters", litter_id, data)
            return jsonify(litter)
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>", methods=["DELETE"])
    def delete_litter(litter_id):
        try:
            db.delete("litters", litter_id)
            return jsonify({"message": "Litter deleted successfully"})
        except DatabaseError as e:
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>/puppies", methods=["POST"])
    def add_puppy_to_litter(litter_id):
        try:
            data = request.json
            
            # Add litter_id to the data
            data['litter_id'] = litter_id
            
            # Ensure name field is set (use call_name if name is empty)
            if not data.get('name') and data.get('call_name'):
                data['name'] = data['call_name']
            
            # Convert empty strings to None for numeric fields
            numeric_fields = ['weight_at_birth', 'min_adult_weight', 'max_adult_weight', 'price']
            for field in numeric_fields:
                if field in data and (data[field] == '' or data[field] == 'null'):
                    data[field] = None
            
            # Convert empty strings to None for optional text fields
            text_fields = ['registered_name', 'microchip', 'description', 'notes', 'markings', 'collar_color']
            for field in text_fields:
                if field in data and data[field] == '':
                    data[field] = None
            
            # Use the db.create method
            result = db.create('puppies', data)
            
            return jsonify(result), 201
            
        except DatabaseError as e:
            return jsonify({'error': str(e)}), 500

    @litters_bp.route('/<int:litter_id>/puppies', methods=['GET'])
    def get_litter_puppies(litter_id):
        try:
            print(f"Fetching puppies for litter {litter_id}")
            
            # Use Supabase query builder
            result = db.supabase.table('puppies').select('*').eq('litter_id', litter_id).execute()
            
            print(f"Query result: {result}")
            
            # Extract data from result
            puppies = result.data if result and hasattr(result, 'data') else []
            
            # Create response with required CORS headers
            response = make_response(jsonify(puppies))
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
            
        except Exception as e:
            print(f"Error fetching puppies: {str(e)}")
            error_response = make_response(jsonify({'error': str(e)}), 500)
            error_response.headers['Access-Control-Allow-Credentials'] = 'true'
            return error_response

    @litters_bp.route('/puppies/<int:puppy_id>', methods=['GET'])
    def get_puppy(puppy_id):
        try:
            result = db.supabase.table('puppies').select('*').eq('id', puppy_id).execute()
            puppy = result.data[0] if result.data else None
            
            if not puppy:
                return jsonify({'error': 'Puppy not found'}), 404
            
            return jsonify(puppy)
            
        except Exception as e:
            print(f"Error fetching puppy: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @litters_bp.route('/puppies/<int:puppy_id>', methods=['PUT'])
    def update_puppy(puppy_id):
        try:
            data = request.json
            result = db.supabase.table('puppies').update(data).eq('id', puppy_id).execute()
            
            if not result.data:
                return jsonify({'error': 'Puppy not found'}), 404
            
            return jsonify(result.data[0])
            
        except Exception as e:
            print(f"Error updating puppy: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @litters_bp.route('/puppies/<int:puppy_id>', methods=['DELETE'])
    def delete_puppy(puppy_id):
        try:
            result = db.supabase.table('puppies').delete().eq('id', puppy_id).execute()
            
            if not result.data:
                return jsonify({'error': 'Puppy not found'}), 404
            
            return jsonify({'message': 'Puppy deleted successfully'})
            
        except Exception as e:
            print(f"Error deleting puppy: {str(e)}")
            return jsonify({'error': str(e)}), 500

    return litters_bp
