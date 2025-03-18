"""
events.py

Blueprint for managing calendar events and event rules.
"""

import json
import datetime
from flask import Blueprint, request, jsonify
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_events_bp(db: DatabaseInterface) -> Blueprint:
    events_bp = Blueprint("events_bp", __name__)
    
    # Get all events
    @events_bp.route("/", methods=["GET"])
    def get_events():
        try:
            debug_log("Fetching all events...")
            
            # Check if we need to filter by date range
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            if start_date and end_date:
                # Convert string dates to datetime objects
                start = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                
                # Query with date filter
                query = """
                    start_date >= :start_date 
                    AND (end_date IS NULL OR end_date <= :end_date)
                """
                events = db.find_with_query("events", query, {
                    "start_date": start,
                    "end_date": end
                })
            else:
                # No date filter, get all events
                events = db.find_by_field_values("events")
            
            # Sort events by start date
            events.sort(key=lambda x: x.get('start_date', ''))
            
            debug_log(f"Found {len(events)} events")
            return jsonify(events)
        
        except Exception as e:
            debug_log(f"Error fetching events: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Get single event
    @events_bp.route("/<int:event_id>", methods=["GET"])
    def get_event(event_id):
        try:
            debug_log(f"Fetching event with ID: {event_id}")
            event = db.get("events", event_id)
            
            if not event:
                return jsonify({"error": f"Event with ID {event_id} not found"}), 404
            
            return jsonify(event)
        
        except Exception as e:
            debug_log(f"Error fetching event: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Create event
    @events_bp.route("/", methods=["POST"])
    def create_event():
        try:
            debug_log("Creating new event...")
            data = request.get_json()
            
            # Required fields
            required_fields = ['title', 'start_date', 'event_type']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Convert start_date and end_date to proper format if they're strings
            for date_field in ['start_date', 'end_date']:
                if date_field in data and isinstance(data[date_field], str):
                    try:
                        data[date_field] = datetime.datetime.fromisoformat(
                            data[date_field].replace('Z', '+00:00')
                        )
                    except ValueError:
                        return jsonify({
                            "error": f"Invalid date format for {date_field}. Use ISO format (YYYY-MM-DDTHH:MM:SS)."
                        }), 400
            
            # Add created_at and updated_at timestamps
            now = datetime.datetime.utcnow()
            data['created_at'] = now
            data['updated_at'] = now
            
            event = db.create("events", data)
            debug_log(f"Created event with ID: {event['id']}")
            
            return jsonify(event), 201
        
        except Exception as e:
            debug_log(f"Error creating event: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Update event
    @events_bp.route("/<int:event_id>", methods=["PUT"])
    def update_event(event_id):
        try:
            debug_log(f"Updating event with ID: {event_id}")
            data = request.get_json()
            
            # Check if event exists
            event = db.get("events", event_id)
            if not event:
                return jsonify({"error": f"Event with ID {event_id} not found"}), 404
            
            # Convert date fields if they're strings
            for date_field in ['start_date', 'end_date']:
                if date_field in data and isinstance(data[date_field], str):
                    try:
                        data[date_field] = datetime.datetime.fromisoformat(
                            data[date_field].replace('Z', '+00:00')
                        )
                    except ValueError:
                        return jsonify({
                            "error": f"Invalid date format for {date_field}. Use ISO format (YYYY-MM-DDTHH:MM:SS)."
                        }), 400
            
            # Update the updated_at timestamp
            data['updated_at'] = datetime.datetime.utcnow()
            
            updated_event = db.update("events", event_id, data)
            debug_log(f"Updated event with ID: {event_id}")
            
            return jsonify(updated_event)
        
        except Exception as e:
            debug_log(f"Error updating event: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Delete event
    @events_bp.route("/<int:event_id>", methods=["DELETE"])
    def delete_event(event_id):
        try:
            debug_log(f"Deleting event with ID: {event_id}")
            
            # Check if event exists
            event = db.get("events", event_id)
            if not event:
                return jsonify({"error": f"Event with ID {event_id} not found"}), 404
            
            db.delete("events", event_id)
            debug_log(f"Deleted event with ID: {event_id}")
            
            return jsonify({"message": f"Event with ID {event_id} deleted successfully"})
        
        except Exception as e:
            debug_log(f"Error deleting event: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Get events by entity (dog, litter, etc.)
    @events_bp.route("/entity/<entity_type>/<int:entity_id>", methods=["GET"])
    def get_events_by_entity(entity_type, entity_id):
        try:
            debug_log(f"Fetching events for {entity_type} with ID: {entity_id}")
            
            events = db.find_by_field_values("events", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            debug_log(f"Found {len(events)} events for {entity_type} {entity_id}")
            return jsonify(events)
        
        except Exception as e:
            debug_log(f"Error fetching events for entity: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Get events by type (birthday, litter_milestone, etc.)
    @events_bp.route("/type/<event_type>", methods=["GET"])
    def get_events_by_type(event_type):
        try:
            debug_log(f"Fetching events of type: {event_type}")
            
            events = db.find_by_field_values("events", {
                "event_type": event_type
            })
            
            debug_log(f"Found {len(events)} events of type {event_type}")
            return jsonify(events)
        
        except Exception as e:
            debug_log(f"Error fetching events by type: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Generate events for a litter
    @events_bp.route("/generate/litter/<int:litter_id>", methods=["POST"])
    def generate_litter_events(litter_id):
        try:
            debug_log(f"Generating events for litter with ID: {litter_id}")
            
            # Get the litter data
            litter = db.get("litters", litter_id)
            if not litter:
                return jsonify({"error": f"Litter with ID {litter_id} not found"}), 404
            
            # Look up the dam to get correct information
            dam = None
            if litter.get('dam_id'):
                dam = db.get("dogs", litter['dam_id'])
            
            # Initialize list to track created events
            created_events = []
            
            # Get whelp date as the base for calculations
            whelp_date = None
            if litter.get('whelp_date'):
                whelp_date = litter['whelp_date']
            elif litter.get('expected_date'):
                whelp_date = litter['expected_date']
            
            if not whelp_date:
                return jsonify({"error": "Litter has no whelp_date or expected_date"}), 400
            
            # Convert to datetime object if it's a string
            if isinstance(whelp_date, str):
                whelp_date = datetime.datetime.fromisoformat(whelp_date.replace('Z', '+00:00'))
            
            # Litter name for events
            litter_name = litter.get('litter_name') or f"Litter #{litter_id}"
            
            # Helper function to create a milestone event
            def create_milestone(days_offset, title, description=None, event_type="litter_milestone", notify=False):
                event_date = whelp_date + datetime.timedelta(days=days_offset)
                
                event_data = {
                    "title": title,
                    "description": description,
                    "start_date": event_date,
                    "end_date": event_date,  # Same day events
                    "all_day": True,
                    "event_type": event_type,
                    "related_type": "litter",
                    "related_id": litter_id,
                    "color": "#4CAF50",  # Green for litter events
                    "notify": notify,
                    "notify_days_before": 1 if notify else 0,
                    "recurring": "none"
                }
                
                # Check if a similar event already exists to avoid duplicates
                existing_events = db.find_by_field_values("events", {
                    "related_type": "litter",
                    "related_id": litter_id,
                    "event_type": event_type,
                    "title": title
                })
                
                if not existing_events:
                    event = db.create("events", event_data)
                    created_events.append(event)
                    return event
                return None
            
            # Create standard milestone events
            milestones = [
                # Puppy development milestones
                (0, f"{litter_name} - Birth day", "Puppies born", True),
                (7, f"{litter_name} - 1 week old", "Puppies are 1 week old. Eyes should start opening."),
                (14, f"{litter_name} - 2 weeks old", "Puppies are 2 weeks old. Starting to crawl."),
                (21, f"{litter_name} - 3 weeks old", "Puppies are 3 weeks old. Begin weaning process."),
                (28, f"{litter_name} - 4 weeks old", "Puppies are 4 weeks old. First vaccinations."),
                (35, f"{litter_name} - 5 weeks old", "Puppies are 5 weeks old. Fully weaned."),
                (42, f"{litter_name} - 6 weeks old", "Puppies are 6 weeks old. Second vaccinations."),
                (49, f"{litter_name} - 7 weeks old", "Puppies are 7 weeks old. Temperament evaluations."),
                (56, f"{litter_name} - 8 weeks old", "Puppies are 8 weeks old. Ready to go to new homes.", True),
                
                # Additional events
                (3, f"{litter_name} - Dewclaw removal", "Schedule dewclaw removal if needed."),
                (10, f"{litter_name} - Start puppy recordings", "Begin recording puppies for future families."),
                (42, f"{litter_name} - Start transition to puppy food", "Begin transitioning to puppy food."),
            ]
            
            # Create all milestone events
            for days, title, description, *args in milestones:
                notify = args[0] if args else False
                create_milestone(days, title, description, notify=notify)
            
            # Dam care events if a dam is associated
            if dam:
                dam_name = dam.get('call_name') or f"Dam #{dam['id']}"
                
                dam_events = [
                    (0, f"{dam_name} - Post-whelp checkup", "Schedule a vet checkup for the dam after whelping.", "vet_appointment", True),
                    (14, f"{dam_name} - Special nutrition needs", "Dam needs extra nutrition during nursing period.", "dog_care"),
                    (42, f"{dam_name} - Begin gradually reducing food", "Start reducing dam's food as puppies are weaned.", "dog_care")
                ]
                
                for days, title, description, event_type, *args in dam_events:
                    notify = args[0] if args else False
                    event_data = {
                        "title": title,
                        "description": description,
                        "start_date": whelp_date + datetime.timedelta(days=days),
                        "end_date": whelp_date + datetime.timedelta(days=days),
                        "all_day": True,
                        "event_type": event_type,
                        "related_type": "dog",
                        "related_id": dam['id'],
                        "color": "#9C27B0",  # Purple for dam events
                        "notify": notify,
                        "notify_days_before": 1 if notify else 0,
                        "recurring": "none"
                    }
                    
                    # Avoid duplicates
                    existing_events = db.find_by_field_values("events", {
                        "related_type": "dog",
                        "related_id": dam['id'],
                        "event_type": event_type,
                        "title": title
                    })
                    
                    if not existing_events:
                        event = db.create("events", event_data)
                        created_events.append(event)
            
            return jsonify({
                "message": f"Generated {len(created_events)} events for litter {litter_id}",
                "events": created_events
            })
        
        except Exception as e:
            debug_log(f"Error generating litter events: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # CRUD operations for event rules
    
    # Get all event rules
    @events_bp.route("/rules", methods=["GET"])
    def get_event_rules():
        try:
            debug_log("Fetching all event rules...")
            rules = db.find_by_field_values("event_rules")
            return jsonify(rules)
        except Exception as e:
            debug_log(f"Error fetching event rules: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Get single event rule
    @events_bp.route("/rules/<int:rule_id>", methods=["GET"])
    def get_event_rule(rule_id):
        try:
            debug_log(f"Fetching event rule with ID: {rule_id}")
            rule = db.get("event_rules", rule_id)
            
            if not rule:
                return jsonify({"error": f"Event rule with ID {rule_id} not found"}), 404
            
            return jsonify(rule)
        except Exception as e:
            debug_log(f"Error fetching event rule: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Create event rule
    @events_bp.route("/rules", methods=["POST"])
    def create_event_rule():
        try:
            debug_log("Creating new event rule...")
            data = request.get_json()
            
            # Required fields
            required_fields = ['name', 'trigger_type', 'action_type', 'action_data']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Validate JSON fields
            for json_field in ['conditions', 'action_data']:
                if json_field in data:
                    if isinstance(data[json_field], str):
                        try:
                            data[json_field] = json.loads(data[json_field])
                        except json.JSONDecodeError:
                            return jsonify({
                                "error": f"Invalid JSON format for {json_field}"
                            }), 400
                    elif json_field == 'action_data' and not isinstance(data[json_field], dict):
                        data[json_field] = {"data": data[json_field]}
            
            # Add timestamps
            now = datetime.datetime.utcnow()
            data['created_at'] = now
            data['updated_at'] = now
            
            rule = db.create("event_rules", data)
            debug_log(f"Created event rule with ID: {rule['id']}")
            
            return jsonify(rule), 201
        except Exception as e:
            debug_log(f"Error creating event rule: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Update event rule
    @events_bp.route("/rules/<int:rule_id>", methods=["PUT"])
    def update_event_rule(rule_id):
        try:
            debug_log(f"Updating event rule with ID: {rule_id}")
            data = request.get_json()
            
            # Check if rule exists
            rule = db.get("event_rules", rule_id)
            if not rule:
                return jsonify({"error": f"Event rule with ID {rule_id} not found"}), 404
            
            # Validate JSON fields
            for json_field in ['conditions', 'action_data']:
                if json_field in data:
                    if isinstance(data[json_field], str):
                        try:
                            data[json_field] = json.loads(data[json_field])
                        except json.JSONDecodeError:
                            return jsonify({
                                "error": f"Invalid JSON format for {json_field}"
                            }), 400
            
            # Update timestamp
            data['updated_at'] = datetime.datetime.utcnow()
            
            updated_rule = db.update("event_rules", rule_id, data)
            debug_log(f"Updated event rule with ID: {rule_id}")
            
            return jsonify(updated_rule)
        except Exception as e:
            debug_log(f"Error updating event rule: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Delete event rule
    @events_bp.route("/rules/<int:rule_id>", methods=["DELETE"])
    def delete_event_rule(rule_id):
        try:
            debug_log(f"Deleting event rule with ID: {rule_id}")
            
            # Check if rule exists
            rule = db.get("event_rules", rule_id)
            if not rule:
                return jsonify({"error": f"Event rule with ID {rule_id} not found"}), 404
            
            db.delete("event_rules", rule_id)
            debug_log(f"Deleted event rule with ID: {rule_id}")
            
            return jsonify({"message": f"Event rule with ID {rule_id} deleted successfully"})
        except Exception as e:
            debug_log(f"Error deleting event rule: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Process event rule for an entity
    @events_bp.route("/rules/process/<trigger_type>/<entity_type>/<int:entity_id>", methods=["POST"])
    def process_rules_for_entity(trigger_type, entity_type, entity_id):
        try:
            debug_log(f"Processing {trigger_type} rules for {entity_type} with ID: {entity_id}")
            
            # Get the entity
            entity = db.get(f"{entity_type}s", entity_id)
            if not entity:
                return jsonify({"error": f"{entity_type.capitalize()} with ID {entity_id} not found"}), 404
            
            # Get all active rules for this trigger type
            rules = db.find_by_field_values("event_rules", {
                "trigger_type": trigger_type,
                "active": True
            })
            
            debug_log(f"Found {len(rules)} rules for trigger {trigger_type}")
            
            # Process each rule
            processed_rules = []
            for rule in rules:
                # Check if conditions match
                conditions_met = True
                if rule.get('conditions'):
                    # Process conditions (simplified for now)
                    # In a real implementation, you'd evaluate each condition against the entity
                    # For now, assume all active rules should run
                    pass
                
                if conditions_met:
                    # Execute the rule's action
                    if rule['action_type'] == 'create_event':
                        action_data = rule['action_data']
                        
                        # Calculate event date based on delay
                        base_date = None
                        if entity_type == 'litter':
                            base_date = entity.get('whelp_date') or entity.get('expected_date')
                        elif entity_type == 'dog':
                            base_date = entity.get('birth_date')
                        
                        if not base_date:
                            continue
                        
                        # Convert to datetime if needed
                        if isinstance(base_date, str):
                            base_date = datetime.datetime.fromisoformat(base_date.replace('Z', '+00:00'))
                        
                        # Add delay
                        days_delay = action_data.get('days_delay', 0)
                        event_date = base_date + datetime.timedelta(days=days_delay)
                        
                        # Format the title and description with entity data
                        title = action_data.get('title', 'Event')
                        description = action_data.get('description', '')
                        
                        # Create the event
                        event_data = {
                            "title": title,
                            "description": description,
                            "start_date": event_date,
                            "end_date": event_date,
                            "all_day": action_data.get('all_day', True),
                            "event_type": action_data.get('event_type', 'custom'),
                            "related_type": entity_type,
                            "related_id": entity_id,
                            "color": action_data.get('color', '#2196F3'),
                            "notify": action_data.get('notify', False),
                            "notify_days_before": action_data.get('notify_days_before', 0),
                            "recurring": action_data.get('recurring', 'none')
                        }
                        
                        # Check for duplicates
                        existing_events = db.find_by_field_values("events", {
                            "related_type": entity_type,
                            "related_id": entity_id,
                            "title": title,
                            "event_type": action_data.get('event_type', 'custom')
                        })
                        
                        if not existing_events:
                            event = db.create("events", event_data)
                            processed_rules.append({
                                "rule_id": rule['id'],
                                "rule_name": rule['name'],
                                "action": "create_event",
                                "result": "Created event with ID " + str(event['id'])
                            })
                        else:
                            processed_rules.append({
                                "rule_id": rule['id'],
                                "rule_name": rule['name'],
                                "action": "create_event",
                                "result": "Event already exists"
                            })
            
            return jsonify({
                "message": f"Processed {len(processed_rules)} rules for {entity_type} {entity_id}",
                "results": processed_rules
            })
        
        except Exception as e:
            debug_log(f"Error processing rules: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Generate birthday events for all dogs
    @events_bp.route("/generate/birthdays", methods=["POST"])
    def generate_birthday_events():
        try:
            debug_log("Generating birthday events for all dogs")
            
            # Get all active dogs
            dogs = db.find_by_field_values("dogs", {"status": "Active"})
            if not dogs:
                return jsonify({"message": "No active dogs found"}), 404
            
            created_events = []
            
            for dog in dogs:
                # Skip if no birth date
                if not dog.get('birth_date'):
                    continue
                
                # Convert to datetime if needed
                birth_date = dog['birth_date']
                if isinstance(birth_date, str):
                    birth_date = datetime.datetime.fromisoformat(birth_date.replace('Z', '+00:00'))
                
                # Get dog's name
                dog_name = dog.get('call_name') or f"Dog #{dog['id']}"
                
                # Create next birthday event (for current year)
                now = datetime.datetime.utcnow()
                current_year = now.year
                
                # Create birthday for current year
                birthday = datetime.datetime(
                    current_year, 
                    birth_date.month, 
                    birth_date.day
                )
                
                # If birthday has passed this year, set for next year
                if birthday < now:
                    birthday = datetime.datetime(
                        current_year + 1,
                        birth_date.month,
                        birth_date.day
                    )
                
                # Calculate age for the upcoming birthday
                age = birthday.year - birth_date.year
                
                # Create event data
                event_data = {
                    "title": f"{dog_name}'s {age}st Birthday",
                    "description": f"{dog_name} turns {age} years old!",
                    "start_date": birthday,
                    "end_date": birthday,
                    "all_day": True,
                    "event_type": "birthday",
                    "related_type": "dog",
                    "related_id": dog['id'],
                    "color": "#FF5722",  # Orange for birthdays
                    "notify": True,
                    "notify_days_before": 7,
                    "recurring": "yearly"
                }
                
                # Check if a similar event already exists
                existing_events = db.find_by_field_values("events", {
                    "related_type": "dog",
                    "related_id": dog['id'],
                    "event_type": "birthday",
                    "recurring": "yearly"
                })
                
                # Skip if already exists
                if existing_events:
                    continue
                
                # Create the event
                event = db.create("events", event_data)
                created_events.append(event)
            
            return jsonify({
                "message": f"Generated {len(created_events)} birthday events",
                "events": created_events
            })
        
        except Exception as e:
            debug_log(f"Error generating birthday events: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    return events_bp