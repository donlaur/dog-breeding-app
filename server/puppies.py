"""
puppies.py

Blueprint for puppy-related endpoints, including:
- Creating new puppies within a litter
- Updating puppy details
- Retrieving puppy information
- Managing puppy availability
"""

from flask import Blueprint, request, jsonify
from server.database.db_interface import DatabaseInterface
from server.database.supabase_db import DatabaseError

def create_puppies_bp(db: DatabaseInterface) -> Blueprint:
    puppies_bp = Blueprint("puppies_bp", __name__)

    @puppies_bp.route('/litters/<int:litter_id>/puppies', methods=['POST'])
    def create_puppy(litter_id):
        data = request.json
        
        query = """
            INSERT INTO puppies (
                name, gender, litter_id, owner_id, price, status, is_available,
                registered_name, call_name, breed_id, color, markings,
                microchip, description, notes, birth_date, sire_id, dam_id,
                program_id, registration_type, weight_at_birth, collar_color,
                min_adult_weight, max_adult_weight
            ) VALUES (
                :name, :gender, :litter_id, :owner_id, :price, :status, :is_available,
                :registered_name, :call_name, :breed_id, :color, :markings,
                :microchip, :description, :notes, :birth_date, :sire_id, :dam_id,
                :program_id, :registration_type, :weight_at_birth, :collar_color,
                :min_adult_weight, :max_adult_weight
            ) RETURNING id
        """
        
        try:
            # Get breed_id and other details from litter if not provided
            litter_query = """
                SELECT breed_id, sire_id, dam_id, program_id, birth_date 
                FROM litters 
                WHERE id = :litter_id
            """
            litter_result = db.session.execute(litter_query, {'litter_id': litter_id})
            litter_data = litter_result.fetchone()
            
            if not litter_data:
                return jsonify({'error': 'Litter not found'}), 404

            # Merge litter data with provided data
            insert_data = {
                'litter_id': litter_id,
                'breed_id': litter_data.breed_id,
                'sire_id': litter_data.sire_id,
                'dam_id': litter_data.dam_id,
                'program_id': litter_data.program_id,
                'birth_date': litter_data.birth_date,
                **data
            }

            result = db.session.execute(query, insert_data)
            db.session.commit()
            return jsonify({'id': result.fetchone()[0]}), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    @puppies_bp.route('/puppies/<int:puppy_id>', methods=['PUT'])
    def update_puppy(puppy_id):
        data = request.json
        
        update_fields = []
        for key in data.keys():
            update_fields.append(f"{key} = :{key}")
        
        query = f"""
            UPDATE puppies 
            SET {', '.join(update_fields)}
            WHERE id = :puppy_id
            RETURNING id
        """
        
        try:
            result = db.session.execute(query, {**data, 'puppy_id': puppy_id})
            db.session.commit()
            return jsonify({'id': result.fetchone()[0]}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    @puppies_bp.route('/puppies/<int:puppy_id>/availability', methods=['PUT'])
    def toggle_availability(puppy_id):
        data = request.json
        is_available = data.get('is_available')
        
        if is_available is None:
            return jsonify({'error': 'is_available field is required'}), 400

        query = """
            UPDATE puppies 
            SET is_available = :is_available,
                status = CASE 
                    WHEN :is_available THEN 'Available'
                    ELSE 'Reserved'
                END
            WHERE id = :puppy_id
            RETURNING id
        """
        
        try:
            result = db.session.execute(query, {
                'is_available': is_available,
                'puppy_id': puppy_id
            })
            db.session.commit()
            return jsonify({'id': result.fetchone()[0]}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    @puppies_bp.route('/puppies/<int:puppy_id>', methods=['GET'])
    def get_puppy(puppy_id):
        query = """
            SELECT p.*, l.litter_name, d.name as breed_name
            FROM puppies p
            LEFT JOIN litters l ON p.litter_id = l.id
            LEFT JOIN dog_breeds d ON p.breed_id = d.id
            WHERE p.id = :puppy_id
        """
        
        try:
            result = db.session.execute(query, {'puppy_id': puppy_id})
            puppy = result.fetchone()
            
            if not puppy:
                return jsonify({'error': 'Puppy not found'}), 404
                
            return jsonify(dict(puppy))
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return puppies_bp