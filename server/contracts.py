"""
Contracts API for managing contract templates and customer contracts.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.config import debug_log, debug_error

# Contract Template Model
class ContractTemplate:
    @staticmethod
    def get_all():
        try:
            response = supabase.table("contract_templates").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            debug_error(f"Error fetching contract templates: {e}")
            return []
    
    @staticmethod
    def get_by_id(template_id):
        try:
            response = supabase.table("contract_templates").select("*").eq("id", template_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error fetching contract template by ID: {e}")
            return None
    
    @staticmethod
    def create_template(data):
        try:
            data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            response = supabase.table("contract_templates").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error creating contract template: {e}")
            return None

# Contract Model
class Contract:
    @staticmethod
    def get_all():
        try:
            response = supabase.table("contracts").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            debug_error(f"Error fetching contracts: {e}")
            return []
    
    @staticmethod
    def get_by_id(contract_id):
        try:
            response = supabase.table("contracts").select("*").eq("id", contract_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error fetching contract by ID: {e}")
            return None
    
    @staticmethod
    def create_contract(data):
        try:
            data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            response = supabase.table("contracts").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error creating contract: {e}")
            return None

# Create blueprint function
def create_contracts_bp(db):
    contracts_bp = Blueprint('contracts', __name__)
    
    # Contract Template Routes
    # Special route for the frontend's expected endpoint format
    @contracts_bp.route('-templates', methods=['GET'])
    @token_required
    def get_contract_templates_alternate(current_user):
        """Get all contract templates (alternate route)"""
        return get_contract_templates(current_user)
        
    @contracts_bp.route('/templates', methods=['GET'])
    @token_required
    def get_contract_templates(current_user):
        """Get all contract templates"""
        try:
            templates = ContractTemplate.get_all()
            debug_log(f"Found {len(templates)} contract templates")
            return jsonify({"success": True, "data": templates}), 200
        except Exception as e:
            debug_error(f"Error in get_contract_templates: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @contracts_bp.route('/templates/<int:template_id>', methods=['GET'])
    @token_required
    def get_contract_template(current_user, template_id):
        """Get a specific contract template"""
        try:
            template = ContractTemplate.get_by_id(template_id)
            if not template:
                return jsonify({"success": False, "error": "Contract template not found"}), 404
            
            return jsonify({"success": True, "data": template}), 200
        except Exception as e:
            debug_error(f"Error in get_contract_template: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @contracts_bp.route('/templates', methods=['POST'])
    @token_required
    def create_contract_template(current_user):
        """Create a new contract template"""
        try:
            data = request.json
            
            # Validate required fields
            if 'name' not in data:
                return jsonify({"success": False, "error": "Name is required"}), 400
                
            if 'content' not in data:
                return jsonify({"success": False, "error": "Template content is required"}), 400
            
            # Create template
            template = ContractTemplate.create_template(data)
            
            return jsonify({"success": True, "data": template}), 201
        except Exception as e:
            debug_error(f"Error in create_contract_template: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    # Contract Routes
    @contracts_bp.route('', methods=['GET'])
    @token_required
    def get_contracts(current_user):
        """Get all contracts"""
        try:
            customer_id = request.args.get('customer_id')
            
            if customer_id:
                # This would require a get_by_customer method
                # For now, filter from all contracts
                all_contracts = Contract.get_all()
                contracts = [c for c in all_contracts if c.get('customer_id') == int(customer_id)]
                debug_log(f"Found {len(contracts)} contracts for customer {customer_id}")
            else:
                contracts = Contract.get_all()
                debug_log(f"Found {len(contracts)} contracts total")
            
            return jsonify({"success": True, "data": contracts}), 200
        except Exception as e:
            debug_error(f"Error in get_contracts: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @contracts_bp.route('/<int:contract_id>', methods=['GET'])
    @token_required
    def get_contract(current_user, contract_id):
        """Get a specific contract"""
        try:
            contract = Contract.get_by_id(contract_id)
            if not contract:
                return jsonify({"success": False, "error": "Contract not found"}), 404
            
            return jsonify({"success": True, "data": contract}), 200
        except Exception as e:
            debug_error(f"Error in get_contract: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @contracts_bp.route('', methods=['POST'])
    @token_required
    def create_contract(current_user):
        """Create a new contract"""
        try:
            data = request.json
            
            # Validate required fields
            if 'customer_id' not in data:
                return jsonify({"success": False, "error": "Customer ID is required"}), 400
            
            if 'template_id' not in data:
                return jsonify({"success": False, "error": "Template ID is required"}), 400
            
            # Create contract
            contract = Contract.create_contract(data)
            
            return jsonify({"success": True, "data": contract}), 201
        except Exception as e:
            debug_error(f"Error in create_contract: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    return contracts_bp