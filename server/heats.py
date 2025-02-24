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
        try:
            data = request.get_json()
            # Remove any ID from the input data to prevent conflicts
            if 'id' in data:
                del data['id']
            if 'created_at' in data:
                del data['created_at']
            if 'updated_at' in data:
                del data['updated_at']
                
            debug_log(f"Creating heat with data: {data}")
            new_heat = db.create('heats', data)
            return jsonify(new_heat), 201
        except DatabaseError as e:
            debug_log(f"Error creating heat: {str(e)}")
            return jsonify({'error': str(e)}), 400

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