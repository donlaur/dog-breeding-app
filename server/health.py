"""
health.py

This module provides API endpoints for managing health-related records:
- General health records
- Vaccinations
- Weight records
- Medications
- Health conditions
"""

import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from .models import (
    HealthRecord, Vaccination, WeightRecord, 
    MedicationRecord, HealthCondition, HealthConditionTemplate
)
from .middleware.auth import token_required

def create_health_bp():
    """Create and return a blueprint for health management"""
    health_bp = Blueprint('health_bp', __name__)
    
    #===== Health Records Endpoints =====
    
    @health_bp.route('/records', methods=['GET'])
    @token_required
    def get_health_records():
        """Get health records with optional filtering"""
        try:
            # Check for filters
            dog_id = request.args.get('dog_id')
            puppy_id = request.args.get('puppy_id')
            record_type = request.args.get('record_type')
            
            if dog_id:
                records = HealthRecord.get_for_dog(int(dog_id))
            elif puppy_id:
                records = HealthRecord.get_for_puppy(int(puppy_id))
            else:
                records = HealthRecord.get_all()
            
            # Apply record type filter if provided
            if record_type:
                records = [r for r in records if r.get('record_type') == record_type]
            
            # Sort by date (most recent first)
            records.sort(key=lambda x: x.get('record_date', ''), reverse=True)
            
            return jsonify({
                'success': True,
                'data': records,
                'count': len(records)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/records/<int:record_id>', methods=['GET'])
    @token_required
    def get_health_record(record_id):
        """Get a specific health record"""
        try:
            record = HealthRecord.get_by_id(record_id)
            
            if not record:
                return jsonify({
                    'success': False,
                    'error': f'Health record with ID {record_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': record
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/records', methods=['POST'])
    @token_required
    def create_health_record():
        """Create a new health record"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['record_date', 'record_type', 'title']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Ensure at least one of dog_id or puppy_id is provided
            if 'dog_id' not in data and 'puppy_id' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Either dog_id or puppy_id must be provided'
                }), 400
            
            # Convert date string to datetime if needed
            if isinstance(data['record_date'], str):
                data['record_date'] = datetime.fromisoformat(data['record_date'].replace('Z', '+00:00'))
            
            # Create the record
            record = HealthRecord.create_record(data)
            
            return jsonify({
                'success': True,
                'data': record,
                'message': 'Health record created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/records/<int:record_id>', methods=['PUT'])
    @token_required
    def update_health_record(record_id):
        """Update an existing health record"""
        try:
            data = request.get_json()
            
            # Check if record exists
            record = HealthRecord.get_by_id(record_id)
            if not record:
                return jsonify({
                    'success': False,
                    'error': f'Health record with ID {record_id} not found'
                }), 404
            
            # Convert date string to datetime if needed
            if 'record_date' in data and isinstance(data['record_date'], str):
                data['record_date'] = datetime.fromisoformat(data['record_date'].replace('Z', '+00:00'))
            
            # Update the record
            updated_record = HealthRecord.update_record(record_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_record,
                'message': 'Health record updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/records/<int:record_id>', methods=['DELETE'])
    @token_required
    def delete_health_record(record_id):
        """Delete a health record"""
        try:
            # Check if record exists
            record = HealthRecord.get_by_id(record_id)
            if not record:
                return jsonify({
                    'success': False,
                    'error': f'Health record with ID {record_id} not found'
                }), 404
            
            # Delete the record
            HealthRecord.delete_record(record_id)
            
            return jsonify({
                'success': True,
                'message': f'Health record with ID {record_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Vaccinations Endpoints =====
    
    @health_bp.route('/vaccinations', methods=['GET'])
    @token_required
    def get_vaccinations():
        """Get vaccinations with optional filtering"""
        try:
            # Check for filters
            dog_id = request.args.get('dog_id')
            puppy_id = request.args.get('puppy_id')
            upcoming = request.args.get('upcoming')
            days = request.args.get('days', 30)
            
            if upcoming and upcoming.lower() == 'true':
                vaccinations = Vaccination.get_upcoming_vaccinations(int(days))
            elif dog_id:
                vaccinations = Vaccination.get_for_dog(int(dog_id))
            elif puppy_id:
                vaccinations = Vaccination.get_for_puppy(int(puppy_id))
            else:
                vaccinations = Vaccination.get_all()
            
            # Sort by administration date (most recent first)
            vaccinations.sort(key=lambda x: x.get('administration_date', ''), reverse=True)
            
            return jsonify({
                'success': True,
                'data': vaccinations,
                'count': len(vaccinations)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/vaccinations/<int:vaccination_id>', methods=['GET'])
    @token_required
    def get_vaccination(vaccination_id):
        """Get a specific vaccination"""
        try:
            vaccination = Vaccination.get_by_id(vaccination_id)
            
            if not vaccination:
                return jsonify({
                    'success': False,
                    'error': f'Vaccination with ID {vaccination_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': vaccination
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/vaccinations', methods=['POST'])
    @token_required
    def create_vaccination():
        """Create a new vaccination record"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['vaccine_name', 'administration_date']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Ensure at least one of dog_id or puppy_id is provided
            if 'dog_id' not in data and 'puppy_id' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Either dog_id or puppy_id must be provided'
                }), 400
            
            # Convert date strings to datetime if needed
            date_fields = ['administration_date', 'expiration_date', 'next_due_date']
            for field in date_fields:
                if field in data and isinstance(data[field], str):
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
            
            # Create the vaccination record
            vaccination = Vaccination.create_vaccination(data)
            
            return jsonify({
                'success': True,
                'data': vaccination,
                'message': 'Vaccination record created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/vaccinations/<int:vaccination_id>', methods=['PUT'])
    @token_required
    def update_vaccination(vaccination_id):
        """Update an existing vaccination record"""
        try:
            data = request.get_json()
            
            # Check if vaccination exists
            vaccination = Vaccination.get_by_id(vaccination_id)
            if not vaccination:
                return jsonify({
                    'success': False,
                    'error': f'Vaccination with ID {vaccination_id} not found'
                }), 404
            
            # Convert date strings to datetime if needed
            date_fields = ['administration_date', 'expiration_date', 'next_due_date']
            for field in date_fields:
                if field in data and isinstance(data[field], str):
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
            
            # Update the vaccination record
            updated_vaccination = Vaccination.update_vaccination(vaccination_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_vaccination,
                'message': 'Vaccination record updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/vaccinations/<int:vaccination_id>', methods=['DELETE'])
    @token_required
    def delete_vaccination(vaccination_id):
        """Delete a vaccination record"""
        try:
            # Check if vaccination exists
            vaccination = Vaccination.get_by_id(vaccination_id)
            if not vaccination:
                return jsonify({
                    'success': False,
                    'error': f'Vaccination with ID {vaccination_id} not found'
                }), 404
            
            # Delete the vaccination record
            Vaccination.delete_vaccination(vaccination_id)
            
            return jsonify({
                'success': True,
                'message': f'Vaccination with ID {vaccination_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Weight Records Endpoints =====
    
    @health_bp.route('/weights', methods=['GET'])
    @token_required
    def get_weight_records():
        """Get weight records with optional filtering"""
        try:
            # Check for filters
            dog_id = request.args.get('dog_id')
            puppy_id = request.args.get('puppy_id')
            
            if dog_id:
                weights = WeightRecord.get_for_dog(int(dog_id))
            elif puppy_id:
                weights = WeightRecord.get_for_puppy(int(puppy_id))
            else:
                weights = WeightRecord.get_all()
            
            # Sort by measurement date (most recent first)
            weights.sort(key=lambda x: x.get('measurement_date', ''), reverse=True)
            
            return jsonify({
                'success': True,
                'data': weights,
                'count': len(weights)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/weights/<int:record_id>', methods=['GET'])
    @token_required
    def get_weight_record(record_id):
        """Get a specific weight record"""
        try:
            weight = WeightRecord.get_by_id(record_id)
            
            if not weight:
                return jsonify({
                    'success': False,
                    'error': f'Weight record with ID {record_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': weight
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/weights', methods=['POST'])
    @token_required
    def create_weight_record():
        """Create a new weight record"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['weight', 'measurement_date']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Ensure at least one of dog_id or puppy_id is provided
            if 'dog_id' not in data and 'puppy_id' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Either dog_id or puppy_id must be provided'
                }), 400
            
            # Convert date string to datetime if needed
            if isinstance(data['measurement_date'], str):
                data['measurement_date'] = datetime.fromisoformat(data['measurement_date'].replace('Z', '+00:00'))
            
            # Create the weight record
            weight = WeightRecord.create_record(data)
            
            return jsonify({
                'success': True,
                'data': weight,
                'message': 'Weight record created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/weights/<int:record_id>', methods=['PUT'])
    @token_required
    def update_weight_record(record_id):
        """Update an existing weight record"""
        try:
            data = request.get_json()
            
            # Check if weight record exists
            weight = WeightRecord.get_by_id(record_id)
            if not weight:
                return jsonify({
                    'success': False,
                    'error': f'Weight record with ID {record_id} not found'
                }), 404
            
            # Convert date string to datetime if needed
            if 'measurement_date' in data and isinstance(data['measurement_date'], str):
                data['measurement_date'] = datetime.fromisoformat(data['measurement_date'].replace('Z', '+00:00'))
            
            # Update the weight record
            updated_weight = WeightRecord.update_record(record_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_weight,
                'message': 'Weight record updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/weights/<int:record_id>', methods=['DELETE'])
    @token_required
    def delete_weight_record(record_id):
        """Delete a weight record"""
        try:
            # Check if weight record exists
            weight = WeightRecord.get_by_id(record_id)
            if not weight:
                return jsonify({
                    'success': False,
                    'error': f'Weight record with ID {record_id} not found'
                }), 404
            
            # Delete the weight record
            WeightRecord.delete_record(record_id)
            
            return jsonify({
                'success': True,
                'message': f'Weight record with ID {record_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Medication Records Endpoints =====
    
    @health_bp.route('/medications', methods=['GET'])
    @token_required
    def get_medication_records():
        """Get medication records with optional filtering"""
        try:
            # Check for filters
            dog_id = request.args.get('dog_id')
            puppy_id = request.args.get('puppy_id')
            active_only = request.args.get('active_only')
            
            if active_only and active_only.lower() == 'true':
                medications = MedicationRecord.get_active_medications()
            elif dog_id:
                medications = MedicationRecord.get_for_dog(int(dog_id))
            elif puppy_id:
                medications = MedicationRecord.get_for_puppy(int(puppy_id))
            else:
                medications = MedicationRecord.get_all()
            
            # Sort by administration date (most recent first)
            medications.sort(key=lambda x: x.get('administration_date', ''), reverse=True)
            
            return jsonify({
                'success': True,
                'data': medications,
                'count': len(medications)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/medications/<int:record_id>', methods=['GET'])
    @token_required
    def get_medication_record(record_id):
        """Get a specific medication record"""
        try:
            medication = MedicationRecord.get_by_id(record_id)
            
            if not medication:
                return jsonify({
                    'success': False,
                    'error': f'Medication record with ID {record_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': medication
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/medications', methods=['POST'])
    @token_required
    def create_medication_record():
        """Create a new medication record"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['medication_name', 'administration_date']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Ensure at least one of dog_id or puppy_id is provided
            if 'dog_id' not in data and 'puppy_id' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Either dog_id or puppy_id must be provided'
                }), 400
            
            # Convert date strings to datetime if needed
            date_fields = ['administration_date', 'end_date']
            for field in date_fields:
                if field in data and isinstance(data[field], str):
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
            
            # Create the medication record
            medication = MedicationRecord.create_record(data)
            
            return jsonify({
                'success': True,
                'data': medication,
                'message': 'Medication record created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/medications/<int:record_id>', methods=['PUT'])
    @token_required
    def update_medication_record(record_id):
        """Update an existing medication record"""
        try:
            data = request.get_json()
            
            # Check if medication record exists
            medication = MedicationRecord.get_by_id(record_id)
            if not medication:
                return jsonify({
                    'success': False,
                    'error': f'Medication record with ID {record_id} not found'
                }), 404
            
            # Convert date strings to datetime if needed
            date_fields = ['administration_date', 'end_date']
            for field in date_fields:
                if field in data and isinstance(data[field], str):
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
            
            # Update the medication record
            updated_medication = MedicationRecord.update_record(record_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_medication,
                'message': 'Medication record updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/medications/<int:record_id>', methods=['DELETE'])
    @token_required
    def delete_medication_record(record_id):
        """Delete a medication record"""
        try:
            # Check if medication record exists
            medication = MedicationRecord.get_by_id(record_id)
            if not medication:
                return jsonify({
                    'success': False,
                    'error': f'Medication record with ID {record_id} not found'
                }), 404
            
            # Delete the medication record
            MedicationRecord.delete_record(record_id)
            
            return jsonify({
                'success': True,
                'message': f'Medication record with ID {record_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Health Conditions Endpoints =====
    
    @health_bp.route('/conditions', methods=['GET'])
    @token_required
    def get_health_conditions():
        """Get health conditions with optional filtering"""
        try:
            # Check for filters
            dog_id = request.args.get('dog_id')
            puppy_id = request.args.get('puppy_id')
            status = request.args.get('status')
            
            if dog_id:
                conditions = HealthCondition.get_for_dog(int(dog_id))
            elif puppy_id:
                conditions = HealthCondition.get_for_puppy(int(puppy_id))
            elif status:
                conditions = HealthCondition.get_by_status(status)
            else:
                conditions = HealthCondition.get_all()
            
            return jsonify({
                'success': True,
                'data': conditions,
                'count': len(conditions)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/conditions/<int:condition_id>', methods=['GET'])
    @token_required
    def get_health_condition(condition_id):
        """Get a specific health condition"""
        try:
            condition = HealthCondition.get_by_id(condition_id)
            
            if not condition:
                return jsonify({
                    'success': False,
                    'error': f'Health condition with ID {condition_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': condition
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/conditions', methods=['POST'])
    @token_required
    def create_health_condition():
        """Create a new health condition"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['condition_name']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Ensure at least one of dog_id or puppy_id is provided
            if 'dog_id' not in data and 'puppy_id' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Either dog_id or puppy_id must be provided'
                }), 400
            
            # Convert date string to datetime if needed
            if 'diagnosis_date' in data and isinstance(data['diagnosis_date'], str):
                data['diagnosis_date'] = datetime.fromisoformat(data['diagnosis_date'].replace('Z', '+00:00'))
            
            # Create the health condition
            condition = HealthCondition.create_condition(data)
            
            return jsonify({
                'success': True,
                'data': condition,
                'message': 'Health condition created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/conditions/<int:condition_id>', methods=['PUT'])
    @token_required
    def update_health_condition(condition_id):
        """Update an existing health condition"""
        try:
            data = request.get_json()
            
            # Check if health condition exists
            condition = HealthCondition.get_by_id(condition_id)
            if not condition:
                return jsonify({
                    'success': False,
                    'error': f'Health condition with ID {condition_id} not found'
                }), 404
            
            # Convert date string to datetime if needed
            if 'diagnosis_date' in data and isinstance(data['diagnosis_date'], str):
                data['diagnosis_date'] = datetime.fromisoformat(data['diagnosis_date'].replace('Z', '+00:00'))
            
            # Update the health condition
            updated_condition = HealthCondition.update_condition(condition_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_condition,
                'message': 'Health condition updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/conditions/<int:condition_id>', methods=['DELETE'])
    @token_required
    def delete_health_condition(condition_id):
        """Delete a health condition"""
        try:
            # Check if health condition exists
            condition = HealthCondition.get_by_id(condition_id)
            if not condition:
                return jsonify({
                    'success': False,
                    'error': f'Health condition with ID {condition_id} not found'
                }), 404
            
            # Delete the health condition
            HealthCondition.delete_condition(condition_id)
            
            return jsonify({
                'success': True,
                'message': f'Health condition with ID {condition_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Health Condition Templates Endpoints =====
    
    @health_bp.route('/condition-templates', methods=['GET'])
    @token_required
    def get_condition_templates():
        """Get health condition templates with optional filtering"""
        try:
            # Check for filters
            breed_id = request.args.get('breed_id')
            
            if breed_id:
                templates = HealthConditionTemplate.get_by_breed(int(breed_id))
            else:
                templates = HealthConditionTemplate.get_all()
            
            return jsonify({
                'success': True,
                'data': templates,
                'count': len(templates)
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/condition-templates/<int:template_id>', methods=['GET'])
    @token_required
    def get_condition_template(template_id):
        """Get a specific health condition template"""
        try:
            template = HealthConditionTemplate.get_by_id(template_id)
            
            if not template:
                return jsonify({
                    'success': False,
                    'error': f'Health condition template with ID {template_id} not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': template
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/condition-templates', methods=['POST'])
    @token_required
    def create_condition_template():
        """Create a new health condition template"""
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['condition_name']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Handle JSON fields
            if 'symptoms' in data and isinstance(data['symptoms'], str):
                try:
                    data['symptoms'] = json.loads(data['symptoms'])
                except json.JSONDecodeError:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid JSON format for symptoms'
                    }), 400
            
            # Create the health condition template
            template = HealthConditionTemplate.create_template(data)
            
            return jsonify({
                'success': True,
                'data': template,
                'message': 'Health condition template created successfully'
            }), 201
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/condition-templates/<int:template_id>', methods=['PUT'])
    @token_required
    def update_condition_template(template_id):
        """Update an existing health condition template"""
        try:
            data = request.get_json()
            
            # Check if template exists
            template = HealthConditionTemplate.get_by_id(template_id)
            if not template:
                return jsonify({
                    'success': False,
                    'error': f'Health condition template with ID {template_id} not found'
                }), 404
            
            # Handle JSON fields
            if 'symptoms' in data and isinstance(data['symptoms'], str):
                try:
                    data['symptoms'] = json.loads(data['symptoms'])
                except json.JSONDecodeError:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid JSON format for symptoms'
                    }), 400
            
            # Update the health condition template
            updated_template = HealthConditionTemplate.update_template(template_id, data)
            
            return jsonify({
                'success': True,
                'data': updated_template,
                'message': 'Health condition template updated successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @health_bp.route('/condition-templates/<int:template_id>', methods=['DELETE'])
    @token_required
    def delete_condition_template(template_id):
        """Delete a health condition template"""
        try:
            # Check if template exists
            template = HealthConditionTemplate.get_by_id(template_id)
            if not template:
                return jsonify({
                    'success': False,
                    'error': f'Health condition template with ID {template_id} not found'
                }), 404
            
            # Delete the health condition template
            HealthConditionTemplate.delete_template(template_id)
            
            return jsonify({
                'success': True,
                'message': f'Health condition template with ID {template_id} deleted successfully'
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    #===== Health Dashboard Endpoints =====
    
    @health_bp.route('/dashboard', methods=['GET'])
    @token_required
    def get_health_dashboard():
        """Get health dashboard data for dogs/puppies"""
        try:
            # Get upcoming vaccinations (next 60 days)
            upcoming_vaccinations = Vaccination.get_upcoming_vaccinations(60)
            
            # Get active medications
            active_medications = MedicationRecord.get_active_medications()
            
            # Get active health conditions
            active_conditions = HealthCondition.get_by_status('active')
            
            # Get recent health records (last 30 days)
            all_records = HealthRecord.get_all()
            thirty_days_ago = datetime.utcnow() - datetime.timedelta(days=30)
            recent_records = [
                r for r in all_records 
                if isinstance(r.get('record_date'), datetime) and r['record_date'] >= thirty_days_ago
            ]
            
            # Return dashboard data
            return jsonify({
                'success': True,
                'data': {
                    'upcoming_vaccinations': {
                        'count': len(upcoming_vaccinations),
                        'items': upcoming_vaccinations
                    },
                    'active_medications': {
                        'count': len(active_medications),
                        'items': active_medications
                    },
                    'active_conditions': {
                        'count': len(active_conditions),
                        'items': active_conditions
                    },
                    'recent_records': {
                        'count': len(recent_records),
                        'items': recent_records
                    }
                }
            })
        
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return health_bp