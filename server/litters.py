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
            
            # If we have litters, fetch the parent details
            if litters:
                # Get all unique dam and sire IDs
                dam_ids = list(set(litter['dam_id'] for litter in litters if litter.get('dam_id')))
                sire_ids = list(set(litter['sire_id'] for litter in litters if litter.get('sire_id')))
                
                # Fetch all dams and sires in one query each
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
                
                # Add parent details to each litter
                for litter in litters:
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
        debug_log(f"Fetching litter with ID: {litter_id}")
        try:
            # First get the litter details
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
                "created_at",
                "updated_at",
                "price",
                "deposit"
            ).eq("id", litter_id).single().execute()
            
            litter = response.data
            if not litter:
                return jsonify({"error": "Litter not found"}), 404
            
            try:
                # Fetch dam details if exists
                if litter.get('dam_id'):
                    dam_response = db.supabase.table("dogs").select(
                        "id", "call_name", "cover_photo", "birth_date"
                    ).eq("id", litter['dam_id']).single().execute()
                    if dam_response.data:
                        litter['dam_name'] = dam_response.data.get('call_name')
                        litter['dam_photo'] = dam_response.data.get('cover_photo')
                        litter['dam_birth_date'] = dam_response.data.get('birth_date')
            except Exception as e:
                debug_log(f"Error fetching dam details: {str(e)}")
                # Continue without dam details
                
            try:
                # Fetch sire details if exists
                if litter.get('sire_id'):
                    sire_response = db.supabase.table("dogs").select(
                        "id", "call_name", "cover_photo", "birth_date"
                    ).eq("id", litter['sire_id']).single().execute()
                    if sire_response.data:
                        litter['sire_name'] = sire_response.data.get('call_name')
                        litter['sire_photo'] = sire_response.data.get('cover_photo')
                        litter['sire_birth_date'] = sire_response.data.get('birth_date')
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
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/", methods=["POST"])
    def create_litter():
        try:
            # Check if the request is multipart/form-data
            if request.content_type and 'multipart/form-data' in request.content_type:
                # Handle form data submission with file upload
                data = {}
                
                # Extract form fields
                for field in request.form:
                    value = request.form[field]
                    # Convert empty strings to None for specific fields
                    if field in ['price', 'deposit', 'num_puppies'] and value == '':
                        data[field] = None
                    elif field in ['birth_date', 'expected_date', 'planned_date', 'availability_date'] and value == '':
                        data[field] = None
                    else:
                        data[field] = value
                
                # Handle file upload if present
                if 'cover_photo' in request.files:
                    file = request.files['cover_photo']
                    if file and file.filename:
                        # Generate a unique filename
                        filename = secure_filename(file.filename)
                        unique_filename = f"{uuid.uuid4()}_{filename}"
                        
                        # Path for temporary storage
                        temp_path = os.path.join(tempfile.gettempdir(), unique_filename)
                        file.save(temp_path)
                        
                        try:
                            # Upload to Supabase Storage
                            with open(temp_path, 'rb') as f:
                                # Assume we're using supabase_db instance passed to the blueprint
                                upload_path = f"litter_photos/{unique_filename}"
                                db.supabase.storage.from_('litter-photos').upload(
                                    file=f,
                                    path=upload_path,
                                    file_options={"content-type": file.content_type}
                                )
                                
                                # Get public URL for the uploaded file
                                photo_url = db.supabase.storage.from_('litter-photos').get_public_url(upload_path)
                                data['cover_photo'] = photo_url
                        finally:
                            # Clean up temp file
                            if os.path.exists(temp_path):
                                os.remove(temp_path)
                
                # Create litter record in database
                litter = db.create("litters", data)
                return jsonify(litter), 201
            else:
                # Handle JSON submission (no file upload)
                data = request.get_json()
                
                # Remove form-specific fields
                if 'cover_photo_file' in data:
                    del data['cover_photo_file']
                if 'cover_photo_preview' in data:
                    del data['cover_photo_preview']
                    
                # Convert empty strings to None
                for field in ['price', 'deposit', 'num_puppies']:
                    if field in data and data[field] == '':
                        data[field] = None
                        
                for field in ['birth_date', 'expected_date', 'planned_date', 'availability_date']:
                    if field in data and data[field] == '':
                        data[field] = None
                
                litter = db.create("litters", data)
                return jsonify(litter), 201
        except Exception as e:
            import traceback
            traceback.print_exc()
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
