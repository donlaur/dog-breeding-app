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

    @program_bp.route("/dashboard", methods=["GET", "OPTIONS"])
    def get_dashboard_stats():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
            return response
        
        debug_log("Fetching dashboard statistics...")
        try:
            # Verify authentication
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Authentication required"}), 401
            
            try:
                # First, check if any dogs exist at all (for debugging)
                all_dogs = db.get_filtered("dogs", {})
                debug_log(f"Total dogs in database: {len(all_dogs)}")
                
                # Log is_adult values to help debug
                is_adult_values = set(str(dog.get('is_adult')) for dog in all_dogs if 'is_adult' in dog)
                debug_log(f"Unique is_adult values in database: {is_adult_values}")
                
                # Get adult dogs - handle boolean or string representations
                adult_dogs = []
                for dog in all_dogs:
                    is_adult = dog.get('is_adult')
                    # Convert various representations to boolean
                    if isinstance(is_adult, bool):
                        is_adult_bool = is_adult
                    elif isinstance(is_adult, str):
                        is_adult_bool = is_adult.lower() in ('true', 't', 'yes', 'y', '1')
                    else:
                        is_adult_bool = False
                    
                    if is_adult_bool:
                        adult_dogs.append(dog)
                
                debug_log(f"Found {len(adult_dogs)} adult dogs")
                
                # Filter adult dogs by gender with case-insensitive comparison
                male_dogs = [dog for dog in adult_dogs if dog.get('gender', '').lower() == 'male']
                female_dogs = [dog for dog in adult_dogs if dog.get('gender', '').lower() == 'female']
                
                debug_log(f"Found {len(male_dogs)} male dogs and {len(female_dogs)} female dogs")
                
                # Get puppies (non-adult dogs)
                puppies = [dog for dog in all_dogs if dog not in adult_dogs]
                debug_log(f"Found {len(puppies)} puppies (non-adult dogs)")
                
                # Filter puppies by status with case-insensitive comparison
                available_puppies = [pup for pup in puppies if pup.get('status', '').lower() == 'available']
                reserved_puppies = [pup for pup in puppies if pup.get('status', '').lower() == 'reserved'] 
                sold_puppies = [pup for pup in puppies if pup.get('status', '').lower() == 'sold']
                
                debug_log(f"Puppies by status: {len(available_puppies)} available, {len(reserved_puppies)} reserved, {len(sold_puppies)} sold")
                
                # Get active litters
                all_litters = db.get_filtered("litters", {})
                debug_log(f"Total litters in database: {len(all_litters)}")
                
                # Log status values to help debug
                litter_statuses = set(litter.get('status', '').lower() for litter in all_litters if 'status' in litter)
                debug_log(f"Unique litter status values: {litter_statuses}")
                
                # Case-insensitive filtering for active litters
                active_litters = [litter for litter in all_litters if litter.get('status', '').lower() == 'active']
                debug_log(f"Found {len(active_litters)} active litters")
                
                # Get upcoming heats
                all_heats = db.get_filtered("heats", {})
                debug_log(f"Total heats in database: {len(all_heats)}")
                
                # Process them to determine which are upcoming
                from datetime import datetime
                today = datetime.now().date()
                upcoming_heats = []
                
                if all_heats:
                    for heat in all_heats:
                        # Check expected_whelp_date first, then start_date if available
                        heat_date_str = heat.get('expected_whelp_date') or heat.get('start_date')
                        if not heat_date_str:
                            continue
                        
                        try:
                            # Try to parse date - handle different formats
                            heat_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S']:
                                try:
                                    heat_date = datetime.strptime(str(heat_date_str), fmt).date()
                                    break
                                except (ValueError, TypeError):
                                    continue
                            
                            if heat_date and heat_date >= today:
                                # Get the associated dog to include dog_name
                                if 'dog_id' in heat and heat['dog_id']:
                                    try:
                                        dog = db.get_by_id("dogs", heat['dog_id'])
                                        if dog:
                                            heat['dog_name'] = dog.get('registered_name') or dog.get('call_name') or f"Dog #{heat['dog_id']}"
                                        else:
                                            heat['dog_name'] = f"Dog #{heat['dog_id']}"
                                    except Exception as dog_error:
                                        debug_log(f"Error fetching dog: {str(dog_error)}")
                                        heat['dog_name'] = f"Dog #{heat['dog_id']}"
                                else:
                                    heat['dog_name'] = "Unknown Dog"
                                
                                upcoming_heats.append(heat)
                        except Exception as date_error:
                            debug_log(f"Error processing heat date {heat_date_str}: {str(date_error)}")
                
                debug_log(f"Found {len(upcoming_heats)} upcoming heats")
                
                # Check if messages table exists before querying it
                recent_messages = []
                try:
                    debug_log("Fetching recent messages...")
                    recent_messages = db.get_filtered("messages", {})
                    if recent_messages:
                        recent_messages = sorted(recent_messages, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
                    debug_log(f"Found {len(recent_messages)} recent messages")
                except Exception as msg_error:
                    debug_log(f"Error fetching messages (table may not exist): {str(msg_error)}")
                    # Continue without messages
                
                debug_log("Preparing response...")
                # Build response with empty lists as fallbacks
                return jsonify({
                    "stats": {
                        "adult_dogs": {
                            "total": len(male_dogs) + len(female_dogs),
                            "males": len(male_dogs) if male_dogs else 0,
                            "females": len(female_dogs) if female_dogs else 0
                        },
                        "litters": {
                            "active": len(active_litters) if active_litters else 0,
                            "puppies_available": len(available_puppies) if available_puppies else 0,
                            "puppies_reserved": len(reserved_puppies) if reserved_puppies else 0,
                            "puppies_sold": len(sold_puppies) if sold_puppies else 0
                        },
                        "breeding_program": {
                            "upcoming_heats": len(upcoming_heats) if upcoming_heats else 0,
                            "planned_breedings": 0
                        },
                        "engagement": {
                            "recent_messages": len(recent_messages) if recent_messages else 0,
                            "waitlist_count": 0
                        }
                    },
                    "recent_activity": {
                        "messages": recent_messages or [],
                        "upcoming_events": [
                            {
                                "type": "heat",
                                "dog_name": heat.get("dog_name", "Unknown Dog"),
                                "expected_date": heat.get("expected_whelp_date") or heat.get("start_date", "Unknown Date")
                            } for heat in (upcoming_heats or [])
                        ],
                        "active_litters": [
                            {
                                "id": litter.get("id", ""),
                                "name": litter.get("name", "Unnamed Litter"),
                                "whelping_date": litter.get("whelping_date", "Unknown Date"),
                                "puppy_count": litter.get("puppy_count", 0)
                            } for litter in (active_litters or [])
                        ]
                    }
                }), 200
            
            except Exception as db_error:
                debug_log(f"Database error: {str(db_error)}")
                import traceback
                debug_log(traceback.format_exc())
                return jsonify({"error": f"Database error: {str(db_error)}"}), 500
            
        except Exception as e:
            debug_log(f"Error generating dashboard: {str(e)}")
            import traceback
            debug_log(traceback.format_exc())
            return jsonify({"error": f"Failed to generate dashboard: {str(e)}"}), 500

    return program_bp
