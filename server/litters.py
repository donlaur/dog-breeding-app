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
            # First get all litters
            response = db.supabase.table("litters").select(
                "id",
                "litter_name",
                "status",
                "whelp_date",
                "expected_date",
                "num_puppies",
                "dam_id",
                "sire_id",
                "cover_photo",
                "price",
                "deposit",
                "created_at",
                "updated_at"
            ).order("created_at.desc").execute()
            
            litters = response.data if response else []
            
            # If we have litters, fetch additional data
            if litters:
                # Get all unique dam and sire IDs
                dam_ids = list(set(litter['dam_id'] for litter in litters if litter.get('dam_id')))
                sire_ids = list(set(litter['sire_id'] for litter in litters if litter.get('sire_id')))
                
                # Fetch parent details
                dams = {}
                sires = {}
                
                try:
                    if dam_ids:
                        dam_response = db.supabase.table("dogs").select(
                            "id", "call_name", "cover_photo", "birth_date"
                        ).in_("id", dam_ids).execute()
                        if dam_response.data:
                            dams = {dog['id']: dog for dog in dam_response.data}
                except Exception as e:
                    debug_log(f"Error fetching dam details: {str(e)}")
                
                try:
                    if sire_ids:
                        sire_response = db.supabase.table("dogs").select(
                            "id", "call_name", "cover_photo", "birth_date"
                        ).in_("id", sire_ids).execute()
                        if sire_response.data:
                            sires = {dog['id']: dog for dog in sire_response.data}
                except Exception as e:
                    debug_log(f"Error fetching sire details: {str(e)}")

                # Get puppy counts for each litter
                for litter in litters:
                    try:
                        # Count puppies for this litter
                        puppy_count_response = db.supabase.table("puppies").select(
                            "id"
                        ).eq("litter_id", litter['id']).execute()
                        litter['puppy_count'] = len(puppy_count_response.data) if puppy_count_response.data else 0
                    except Exception as e:
                        debug_log(f"Error counting puppies for litter {litter['id']}: {str(e)}")
                        litter['puppy_count'] = 0
                    
                    # Add parent details
                    if litter.get('dam_id') and litter['dam_id'] in dams:
                        dam = dams[litter['dam_id']]
                        litter['dam_name'] = dam.get('call_name')
                        litter['dam_photo'] = dam.get('cover_photo')
                        litter['dam_birth_date'] = dam.get('birth_date')
                    
                    if litter.get('sire_id') and litter['sire_id'] in sires:
                        sire = sires[litter['sire_id']]
                        litter['sire_name'] = sire.get('call_name')
                        litter['sire_photo'] = sire.get('cover_photo')
                        litter['sire_birth_date'] = sire.get('birth_date')
            
            debug_log(f"Found {len(litters)} litters")
            
            # Add CORS headers
            response = make_response(jsonify(litters))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching litters: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/", methods=["OPTIONS"])
    def options():
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    @litters_bp.route("/<int:litter_id>", methods=["GET"])
    def get_litter(litter_id):
        try:
            debug_log(f"Fetching litter with ID: {litter_id}")
            
            # Check if litter exists
            result = db.supabase.table("litters").select("*").eq("id", litter_id).execute()
            if not result.data:
                debug_log(f"Litter not found with ID: {litter_id}")
                
                # Return JSON error response
                response = make_response(jsonify({"error": f"Litter with ID {litter_id} not found"}))
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                response.status_code = 404
                return response
            
            litter = result.data[0]
            
            # Get breed details
            try:
                if litter.get('breed_id'):
                    breed_result = db.supabase.table("dog_breeds").select("*").eq("id", litter['breed_id']).execute()
                    if breed_result.data:
                        litter['breed'] = breed_result.data[0]
            except Exception as e:
                debug_log(f"Error fetching breed details: {str(e)}")
                # Continue without breed details, don't fail the entire request
            
            # Get dam details (mother)
            try:
                if litter.get('dam_id'):
                    dam_result = db.supabase.table("dogs").select("*").eq("id", litter['dam_id']).execute()
                    if dam_result.data:
                        litter['dam'] = dam_result.data[0]
            except Exception as e:
                debug_log(f"Error fetching dam details: {str(e)}")
                # Continue without dam details
            
            # Get sire details (father)
            try:
                if litter.get('sire_id'):
                    sire_result = db.supabase.table("dogs").select("*").eq("id", litter['sire_id']).execute()
                    if sire_result.data:
                        litter['sire'] = sire_result.data[0]
            except Exception as e:
                debug_log(f"Error fetching sire details: {str(e)}")
                # Continue without sire details
            
            debug_log(f"Found litter: {litter}")
            
            # Add CORS headers to response
            response = make_response(jsonify(litter))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching litter: {str(e)}")
            # Return JSON error response
            error_response = {
                "error": str(e),
                "message": "Failed to fetch litter details",
                "status": 500
            }
            response = make_response(jsonify(error_response))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.status_code = 500
            return response

    @litters_bp.route("/", methods=["POST"])
    def create_litter():
        try:
            debug_log("Creating new litter")
            
            # Get form data
            data = {}
            if request.is_json:
                data = request.get_json()
                debug_log(f"Received JSON data: {data}")
            else:
                # Handle form data
                form_data = request.form.to_dict()
                debug_log(f"Received form data: {form_data}")
                
                # Process form data
                for key, value in form_data.items():
                    # Convert empty strings to None for bigint fields
                    if key in ['breed_id', 'sire_id', 'dam_id'] and value == '':
                        data[key] = None
                    else:
                        data[key] = value
                
                # Handle file upload
                if 'cover_photo' in request.files:
                    file = request.files['cover_photo']
                    if file and file.filename:
                        # Process file upload logic here
                        # ...
                        pass
            
            # Ensure bigint fields are properly handled
            for field in ['breed_id', 'sire_id', 'dam_id']:
                if field in data and (data[field] == '' or data[field] is None):
                    data[field] = None
                elif field in data:
                    # Try to convert to int if it's a string
                    try:
                        data[field] = int(data[field])
                        debug_log(f"Converted {field} to int: {data[field]}")
                    except (ValueError, TypeError):
                        debug_log(f"Could not convert {field} value '{data[field]}' to int")
                        data[field] = None
            
            debug_log(f"Processed data for litter creation: {data}")
            
            # Create the litter
            litter = db.create("litters", data)
            
            # Add CORS headers
            response = make_response(jsonify(litter))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error creating litter: {str(e)}")
            return jsonify({"error": f"Failed to create litter: {str(e)}"}), 500

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

    @litters_bp.route('/<int:litter_id>/puppies', methods=['GET'])
    def get_litter_puppies(litter_id):
        try:
            debug_log(f"Fetching puppies for litter {litter_id}")
            
            # First verify the litter exists
            litter = db.supabase.table("litters").select("*").eq("id", litter_id).single().execute()
            if not litter.data:
                return jsonify({"error": "Litter not found"}), 404

            # Get puppies for this litter - only select fields that exist
            result = db.supabase.table("puppies").select(
                "id",
                "name",
                "gender",
                "color",
                "birth_date",
                "status",
                "litter_id",
                "created_at",
                "updated_at"
            ).eq("litter_id", litter_id).execute()
            
            debug_log(f"Found puppies: {result.data if result else []}")
            
            # Add CORS headers
            response = make_response(jsonify(result.data if result else []))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching puppies: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>/puppies", methods=["POST"])
    def add_puppy_to_litter(litter_id):
        try:
            debug_log(f"Adding puppy to litter {litter_id}")
            data = request.get_json()
            
            # Verify litter exists
            litter = db.supabase.table("litters").select("*").eq("id", litter_id).single().execute()
            if not litter.data:
                return jsonify({"error": "Litter not found"}), 404

            # Add litter_id to the puppy data
            data['litter_id'] = litter_id
            
            # Create the puppy record
            result = db.supabase.table("puppies").insert(data).execute()
            
            if not result.data:
                raise Exception("Failed to create puppy record")
            
            # Update puppy count in litter
            current_count = db.supabase.table("puppies").select("id").eq("litter_id", litter_id).execute()
            new_count = len(current_count.data) if current_count.data else 0
            
            # Update litter with new puppy count
            db.supabase.table("litters").update({"puppy_count": new_count}).eq("id", litter_id).execute()
            
            debug_log(f"Successfully added puppy to litter {litter_id}")
            
            # Add CORS headers
            response = make_response(jsonify(result.data[0]))
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error adding puppy: {str(e)}")
            return jsonify({"error": str(e)}), 500

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
