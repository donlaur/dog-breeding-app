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
import traceback

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
        try:
            debug_log("Fetching all litters...")
            
            # Use the abstracted db interface
            litters = db.find("litters")
            
            debug_log(f"Found {len(litters)} litters")
            
            # For each litter, add dam and sire data
            for litter in litters:
                # If dam_id exists, get dam data
                if litter.get('dam_id'):
                    try:
                        dam = db.get("dogs", litter['dam_id'])
                        if dam:
                            litter['dam'] = dam
                    except Exception as e:
                        print(f"Error fetching dam data for litter {litter.get('id')}: {str(e)}")
                
                # If sire_id exists, get sire data
                if litter.get('sire_id'):
                    try:
                        sire = db.get("dogs", litter['sire_id'])
                        if sire:
                            litter['sire'] = sire
                    except Exception as e:
                        print(f"Error fetching sire data for litter {litter.get('id')}: {str(e)}")
            
            debug_log(f"Processed all litters with dam/sire data")
            
            # Add CORS headers to response
            response = jsonify(litters)
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
            print(f"Fetching litter with ID: {litter_id}")
            
            # Use the database abstraction layer 
            litter = db.get("litters", litter_id)
            
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # If dam_id exists, get dam data
            if litter.get('dam_id'):
                try:
                    dam = db.get("dogs", litter['dam_id'])
                    if dam:
                        litter['dam'] = dam
                except Exception as e:
                    print(f"Error fetching dam data: {str(e)}")
            
            # If sire_id exists, get sire data
            if litter.get('sire_id'):
                try:
                    sire = db.get("dogs", litter['sire_id'])
                    if sire:
                        litter['sire'] = sire
                except Exception as e:
                    print(f"Error fetching sire data: {str(e)}")
            
            # Add CORS headers
            response = jsonify(litter)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        except Exception as e:
            print(f"Error getting litter: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

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
            
            # Ensure numeric fields are properly handled
            for field in ['price', 'deposit', 'num_puppies', 'puppy_count']:
                if field in data:
                    if data[field] == '' or data[field] is None:
                        data[field] = None
                    else:
                        # Try to convert to number if it's a string
                        try:
                            if field in ['price', 'deposit']:
                                data[field] = float(data[field])
                            else:
                                data[field] = int(data[field])
                            debug_log(f"Converted {field} to number: {data[field]}")
                        except (ValueError, TypeError):
                            debug_log(f"Could not convert {field} value '{data[field]}' to number")
                            data[field] = None
            
            # Ensure date fields are properly handled
            for field in ['whelp_date', 'expected_date', 'planned_date', 'available_date']:
                if field in data:
                    if data[field] == '' or data[field] is None:
                        data[field] = None
                    debug_log(f"Date field {field}: {data[field]}")
            
            debug_log(f"Processed data for litter creation: {data}")
            
            # More detailed logging about the database connection
            debug_log(f"Database object type: {type(db)}")
            debug_log(f"Database methods: {dir(db)}")
            
            try:
                import os
                # Create a debug file with absolute path
                log_path = os.path.join(os.getcwd(), "litter_debug_final.log")
                print(f"Writing debug log to: {log_path}")
                with open(log_path, "w") as f:
                    f.write(f"Attempting to create litter with data: {data}\n")
                    f.write(f"Current working directory: {os.getcwd()}\n")
                    f.write(f"Database object type: {type(db)}\n")
                    f.write(f"Database methods: {dir(db)}\n")
                
                # Create a completely clean data object - special handling for Supabase
                clean_data = {}
                for key, value in data.items():
                    # Skip empty strings and None values
                    if value == "" or value is None:
                        continue
                    
                    # Include only non-empty values
                    clean_data[key] = value
                
                # Special handling for date fields with empty strings in original data
                for field in ['expected_date', 'planned_date', 'available_date']:
                    if field in data and field not in clean_data:
                        # Explicitly remove these fields from data to avoid them getting through
                        if field in data:
                            del data[field]
                
                # Record the cleaned data
                with open(log_path, "a") as f:
                    f.write(f"Cleaned data for database: {clean_data}\n")
                    f.write(f"Data after date field cleaning: {data}\n")
                
                # Create the litter
                debug_log("Attempting to create litter in database...")
                debug_log(f"Using cleaned data: {clean_data}")
                litter = db.create("litters", clean_data)
                debug_log(f"Successfully created litter: {litter}")
                
                # Record success in debug file
                with open(log_path, "a") as f:
                    f.write(f"Successfully created litter: {litter}\n")
                
                # Add CORS headers
                response = make_response(jsonify(litter))
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                return response
            except Exception as inner_e:
                # Record error in debug file
                with open(log_path, "a") as f:
                    f.write(f"Database error creating litter: {str(inner_e)}\n")
                    f.write(f"Database error traceback: {traceback.format_exc()}\n")
                
                debug_log(f"Database error creating litter: {str(inner_e)}")
                debug_log(f"Database error traceback: {traceback.format_exc()}")
                return jsonify({"error": f"Database error: {str(inner_e)}"}), 500
            
        except Exception as e:
            # Record general error in debug file
            import os
            # If log_path is not defined yet (if outer try-except failed)
            log_path = os.path.join(os.getcwd(), "litter_debug_final.log")
            with open(log_path, "a") as f:
                f.write(f"General error creating litter: {str(e)}\n")
                f.write(f"Error traceback: {traceback.format_exc()}\n")
            
            debug_log(f"Error creating litter: {str(e)}")
            debug_log(f"Error traceback: {traceback.format_exc()}")
            return jsonify({"error": f"Failed to create litter: {str(e)}"}), 500

    @litters_bp.route("/<int:litter_id>", methods=["PUT"])
    def update_litter(litter_id):
        try:
            # Log the incoming request for debugging
            print(f"Updating litter {litter_id} with data: {request.json}")
            
            # First check if litter exists
            litter = db.get("litters", litter_id)
            
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Extract and validate data from request
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Define allowed fields and their data types
            allowed_fields = {
                'litter_name': str,
                'breed_id': (int, type(None)),
                'sire_id': (int, type(None)),
                'dam_id': (int, type(None)),
                'whelp_date': (str, type(None)),
                'expected_date': (str, type(None)),
                'planned_date': (str, type(None)),
                'available_date': (str, type(None)),
                'status': str,
                'price': (float, int, type(None)),
                'deposit': (float, int, type(None)),
                'extras': (str, type(None)),
                'socialization': (str, type(None)),
                'puppy_count': (int, type(None))
            }
            
            # Clean data before updating
            clean_data = {}
            
            # Filter and validate incoming data
            for field, value in data.items():
                if field in allowed_fields:
                    # For empty strings or "null" values, set to None
                    if value == "" or value == "null":
                        clean_data[field] = None
                    else:
                        # Validate field types for non-null values
                        if value is not None:
                            expected_type = allowed_fields[field]
                            # Convert number fields if needed
                            if expected_type in [(int, type(None)), int] and isinstance(value, str):
                                try:
                                    clean_data[field] = int(value)
                                except ValueError:
                                    return jsonify({
                                        "error": f"Invalid value for field '{field}'. Could not convert '{value}' to integer."
                                    }), 400
                            elif expected_type in [(float, int, type(None)), float] and isinstance(value, str):
                                try:
                                    clean_data[field] = float(value)
                                except ValueError:
                                    return jsonify({
                                        "error": f"Invalid value for field '{field}'. Could not convert '{value}' to number."
                                    }), 400
                            else:
                                clean_data[field] = value
                        else:
                            clean_data[field] = None
            
            print(f"Updating litter {litter_id} with clean data: {clean_data}")
            
            # If we have data to update, perform the update
            if clean_data:
                # Use the database abstraction layer to update
                db.update("litters", litter_id, clean_data)
                
                # Get the updated litter
                updated_litter = db.get("litters", litter_id)
                
                # Return the updated litter
                return jsonify(updated_litter), 200
            else:
                return jsonify({"error": "No valid fields to update"}), 400
                
        except Exception as e:
            # Log the full exception for debugging
            print(f"Error updating litter {litter_id}: {str(e)}")
            print(traceback.format_exc())
            
            # Return a helpful error message
            return jsonify({"error": f"Failed to update litter: {str(e)}"}), 500

    @litters_bp.route("/<int:litter_id>", methods=["DELETE"])
    def delete_litter(litter_id):
        try:
            # Use the abstracted db interface to check if litter exists
            existing_litter = db.get("litters", litter_id)
            
            if not existing_litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Use the abstracted db interface to delete
            db.delete("litters", litter_id)
            
            # Add CORS headers to response
            response = jsonify({"message": f"Litter with ID {litter_id} deleted successfully"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error deleting litter: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>/puppies", methods=["GET"])
    def get_litter_puppies(litter_id):
        try:
            debug_log(f"Fetching puppies for litter ID: {litter_id}")
            
            # First check if litter exists
            litter = db.get("litters", litter_id)
            
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Use the abstracted db interface - we need to use a custom query here
            # Since we're filtering puppies by litter_id
            puppies = db.find_by_field("puppies", "litter_id", litter_id)
            
            debug_log(f"Found {len(puppies)} puppies for litter {litter_id}")
            
            # Add CORS headers to response
            response = jsonify(puppies)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching puppies for litter: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @litters_bp.route("/<int:litter_id>/puppies", methods=["POST"])
    def add_puppy_to_litter(litter_id):
        try:
            debug_log(f"Adding puppy to litter ID: {litter_id}")
            
            # First check if litter exists
            litter = db.get("litters", litter_id)
            
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            data = request.get_json()
            
            # Add litter_id to puppy data
            data["litter_id"] = litter_id
            
            # Create the puppy using the abstracted db interface
            puppy = db.create("puppies", data)
            
            # Add CORS headers to response
            response = jsonify(puppy)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error adding puppy to litter: {str(e)}")
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

    @litters_bp.route("/dam/<int:dam_id>", methods=["GET"])
    def get_litters_by_dam(dam_id):
        try:
            debug_log(f"Fetching litters for dam with ID: {dam_id}")
            
            # Get litters where dam_id matches
            litters = db.find_by_field("litters", "dam_id", dam_id)
            
            # For each litter, add sire details if available
            for litter in litters:
                if litter.get('sire_id'):
                    try:
                        sire = db.get("dogs", litter['sire_id'])
                        if sire:
                            litter['sire'] = sire
                    except Exception as e:
                        debug_log(f"Error fetching sire for litter: {str(e)}")
            
            debug_log(f"Found {len(litters)} litters for dam ID {dam_id}")
            
            # Add CORS headers
            response = jsonify(litters)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching litters for dam: {str(e)}")
            debug_log(traceback.format_exc())
            
            # Add CORS headers to error response
            response = jsonify({"error": str(e)})
            response.status_code = 500
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response

    @litters_bp.route("/sire/<int:sire_id>", methods=["GET"])
    def get_litters_by_sire(sire_id):
        try:
            debug_log(f"Fetching litters for sire with ID: {sire_id}")
            
            # Get litters where sire_id matches
            litters = db.find_by_field("litters", "sire_id", sire_id)
            
            # For each litter, add dam details if available
            for litter in litters:
                if litter.get('dam_id'):
                    try:
                        dam = db.get("dogs", litter['dam_id'])
                        if dam:
                            litter['dam'] = dam
                    except Exception as e:
                        debug_log(f"Error fetching dam for litter: {str(e)}")
            
            debug_log(f"Found {len(litters)} litters for sire ID {sire_id}")
            
            # Add CORS headers
            response = jsonify(litters)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        except Exception as e:
            debug_log(f"Error fetching litters for sire: {str(e)}")
            debug_log(traceback.format_exc())
            
            # Add CORS headers to error response
            response = jsonify({"error": str(e)})
            response.status_code = 500
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response

    return litters_bp
