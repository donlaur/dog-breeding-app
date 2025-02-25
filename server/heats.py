from flask import Blueprint, request, jsonify, url_for, redirect
from .database import DatabaseInterface, DatabaseError
from datetime import datetime
from .config import debug_log

heats_bp = Blueprint('heats', __name__)

@heats_bp.route('', methods=['GET', 'POST', 'OPTIONS'])
@heats_bp.route('/', methods=['GET', 'POST', 'OPTIONS'])
def handle_heats():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
        
    if request.method == 'GET':
        try:
            heats = db.get_all('heats')
            return jsonify(heats)
        except DatabaseError as e:
            debug_log(f"Error getting heats: {str(e)}")
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'POST':
        data = request.get_json()
        print(f"Creating heat with data: {data}")
        
        # Convert empty strings to None for both date and integer fields
        date_fields = ['mating_date', 'expected_whelp_date']
        integer_fields = ['sire_id']
        
        # Handle date fields
        for field in date_fields:
            if field in data and data[field] == '':
                data[field] = None
                
        # Handle integer fields
        for field in integer_fields:
            if field in data and data[field] == '':
                data[field] = None
        
        try:
            new_heat = db.create('heats', data)
            print(f"Heat created successfully: {new_heat}")
            return jsonify(new_heat.data[0] if new_heat.data else {}), 201
        except Exception as e:
            print(f"Error creating heat: {str(e)}")
            return jsonify({'error': 'Failed to save heat, please try again'}), 500

@heats_bp.route('/<int:heat_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def handle_heat(heat_id):
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        if request.method == 'GET':
            heat = db.get_by_id('heats', heat_id)
            if heat is None:
                return jsonify({'error': 'Heat not found'}), 404
            return jsonify(heat)
            
        elif request.method == 'PUT':
            data = request.get_json()
            updated_heat = db.update('heats', heat_id, data)
            return jsonify(updated_heat)
            
        elif request.method == 'DELETE':
            db.delete('heats', heat_id)
            return jsonify({'message': 'Heat deleted successfully'}), 200
            
    except DatabaseError as e:
        debug_log(f"Error handling heat {heat_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400

@heats_bp.route('', methods=['GET'])
@heats_bp.route('/', methods=['GET'])
def get_heats():
    try:
        # Get all heats
        heats = db.get_all('heats')
        debug_log(f"Raw heats from database: {heats}")
        
        # For each heat, fetch the associated dog and sire data
        enriched_heats = []
        for heat in heats:
            # Get the dog data
            dog = None
            if heat['dog_id']:
                dog = db.get_by_id('dogs', heat['dog_id'])
                debug_log(f"Found dog for heat {heat['id']}: {dog}")
            
            # Get the sire data
            sire = None
            if heat['sire_id']:
                sire = db.get_by_id('dogs', heat['sire_id'])
                debug_log(f"Found sire for heat {heat['id']}: {sire}")
            
            # Create enriched heat record
            enriched_heat = {
                **heat,
                'dog': dog,
                'sire': sire
            }
            enriched_heats.append(enriched_heat)
            debug_log(f"Enriched heat record: {enriched_heat}")
        
        debug_log(f"All enriched heats: {enriched_heats}")
        return jsonify(enriched_heats)
    except DatabaseError as e:
        debug_log(f"Error getting heats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@heats_bp.route('/<int:heat_id>', methods=['GET'])
def get_heat(heat_id):
    try:
        heat = db.get_by_id('heats', heat_id)
        if not heat:
            return jsonify({'error': 'Heat not found'}), 404

        # Get the dog data
        dog = None
        if heat['dog_id']:
            dog = db.get_by_id('dogs', heat['dog_id'])
            debug_log(f"Found dog for heat {heat_id}: {dog}")
        heat['dog'] = dog

        # Get the sire data
        sire = None
        if heat['sire_id']:
            sire = db.get_by_id('dogs', heat['sire_id'])
            debug_log(f"Found sire for heat {heat_id}: {sire}")
        heat['sire'] = sire

        debug_log(f"Enriched heat record: {heat}")
        return jsonify(heat)
    except DatabaseError as e:
        debug_log(f"Error getting heat: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_heats_bp(database: DatabaseInterface):
    global db
    db = database
    return heats_bp