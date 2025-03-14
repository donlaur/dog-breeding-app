"""
Customers API for managing customer information.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
import importlib.util
import os
spec = importlib.util.spec_from_file_location("models", os.path.join(os.path.dirname(__file__), "models.py"))
models_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_module)
Customer = models_module.Customer
CustomerCommunication = models_module.CustomerCommunication
CustomerContract = models_module.CustomerContract
import json

def create_customers_bp(db):
    customers_bp = Blueprint('customers', __name__)

    @customers_bp.route('', methods=['GET'])
    @token_required
    def get_customers(current_user):
        """Get all customers"""
        try:
            lead_status = request.args.get('lead_status')
            lead_source = request.args.get('lead_source')
            
            if lead_status:
                customers = Customer.get_by_lead_status(lead_status)
            elif lead_source:
                customers = Customer.get_by_lead_source(lead_source)
            else:
                customers = Customer.get_all()
                
            return jsonify({"success": True, "data": customers}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('/recent_leads', methods=['GET'])
    @token_required
    def get_recent_leads(current_user):
        """Get recent leads"""
        try:
            days = request.args.get('days', default=30, type=int)
            leads = Customer.get_recent_leads(days)
            return jsonify({"success": True, "data": leads}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('/<int:customer_id>', methods=['GET'])
    @token_required
    def get_customer(current_user, customer_id):
        """Get a specific customer"""
        try:
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            return jsonify({"success": True, "data": customer}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('', methods=['POST'])
    @token_required
    def create_customer(current_user):
        """Create a new customer"""
        try:
            data = request.json
            
            # Validate required fields
            if 'name' not in data:
                return jsonify({"success": False, "error": "Name is required"}), 400
            
            # Create customer with all available fields
            customer = Customer.create_customer(
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                zip_code=data.get('zip'),
                country=data.get('country'),
                notes=data.get('notes'),
                lead_status=data.get('lead_status', 'new'),
                lead_source=data.get('lead_source'),
                preferred_contact_method=data.get('preferred_contact_method'),
                interests=data.get('interests')
            )
            
            return jsonify({"success": True, "data": customer[0] if customer else None}), 201
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('/<int:customer_id>', methods=['PUT'])
    @token_required
    def update_customer(current_user, customer_id):
        """Update a customer"""
        try:
            data = request.json
            
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Update customer
            updated_customer = Customer.update_customer(customer_id, data)
            
            return jsonify({"success": True, "data": updated_customer[0] if updated_customer else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('/<int:customer_id>', methods=['DELETE'])
    @token_required
    def delete_customer(current_user, customer_id):
        """Delete a customer"""
        try:
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Delete customer
            Customer.delete_customer(customer_id)
            
            return jsonify({"success": True, "message": "Customer deleted successfully"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/<int:customer_id>/puppies', methods=['GET'])
    @token_required
    def get_customer_puppies(current_user, customer_id):
        """Get all puppies associated with a customer"""
        try:
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Get puppies
            puppies = Customer.get_customer_puppies(customer_id)
            
            return jsonify({"success": True, "data": puppies}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    # Communication endpoints
    @customers_bp.route('/<int:customer_id>/communications', methods=['GET'])
    @token_required
    def get_customer_communications(current_user, customer_id):
        """Get all communications for a customer"""
        try:
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Get communications
            communications = CustomerCommunication.get_for_customer(customer_id)
            
            return jsonify({"success": True, "data": communications}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/<int:customer_id>/communications', methods=['POST'])
    @token_required
    def create_customer_communication(current_user, customer_id):
        """Create a new communication for a customer"""
        try:
            data = request.json
            
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Validate required fields
            if 'communication_type' not in data:
                return jsonify({"success": False, "error": "Communication type is required"}), 400
            
            # Parse follow_up_date if provided
            follow_up_date = None
            if data.get('follow_up_date'):
                try:
                    follow_up_date = datetime.strptime(data.get('follow_up_date'), "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid follow-up date format. Use YYYY-MM-DD HH:MM:SS"}), 400
            
            # Create communication
            communication = CustomerCommunication.create_communication(
                customer_id=customer_id,
                communication_type=data.get('communication_type'),
                subject=data.get('subject'),
                content=data.get('content'),
                initiated_by=data.get('initiated_by'),
                follow_up_date=follow_up_date,
                notes=data.get('notes')
            )
            
            return jsonify({"success": True, "data": communication[0] if communication else None}), 201
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/communications/<int:communication_id>', methods=['PUT'])
    @token_required
    def update_communication(current_user, communication_id):
        """Update a communication"""
        try:
            data = request.json
            
            # Check if communication exists
            communication = CustomerCommunication.get_by_id(communication_id)
            if not communication:
                return jsonify({"success": False, "error": "Communication not found"}), 404
            
            # Remove any fields that are not part of the table schema
            fields_to_clean = ['customer_name', 'id', 'created_at']
            for field in fields_to_clean:
                if field in data:
                    del data[field]
            
            # Update follow_up_date if provided
            if 'follow_up_date' in data and data['follow_up_date']:
                try:
                    follow_up_date = datetime.strptime(data['follow_up_date'], "%Y-%m-%d %H:%M:%S")
                    data['follow_up_date'] = follow_up_date.strftime("%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid follow-up date format. Use YYYY-MM-DD HH:MM:SS"}), 400
            
            # Update communication
            updated_communication = CustomerCommunication.update_communication(communication_id, data)
            
            return jsonify({"success": True, "data": updated_communication[0] if updated_communication else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/communications/<int:communication_id>', methods=['DELETE'])
    @token_required
    def delete_communication(current_user, communication_id):
        """Delete a communication"""
        try:
            # Check if communication exists
            communication = CustomerCommunication.get_by_id(communication_id)
            if not communication:
                return jsonify({"success": False, "error": "Communication not found"}), 404
            
            # Delete communication
            CustomerCommunication.delete_communication(communication_id)
            
            return jsonify({"success": True, "message": "Communication deleted successfully"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/communications/followups', methods=['GET'])
    @token_required
    def get_followups_due(current_user):
        """Get all follow-ups due in the next x days"""
        try:
            days = request.args.get('days', default=7, type=int)
            followups = CustomerCommunication.get_followups_due(days)
            return jsonify({"success": True, "data": followups}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    # Contract endpoints
    @customers_bp.route('/<int:customer_id>/contracts', methods=['GET'])
    @token_required
    def get_customer_contracts(current_user, customer_id):
        """Get all contracts for a customer"""
        try:
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Get contracts
            contracts = CustomerContract.get_for_customer(customer_id)
            
            return jsonify({"success": True, "data": contracts}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/<int:customer_id>/contracts', methods=['POST'])
    @token_required
    def create_customer_contract(current_user, customer_id):
        """Create a new contract for a customer"""
        try:
            data = request.json
            
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
            
            # Validate required fields
            if 'contract_type' not in data:
                return jsonify({"success": False, "error": "Contract type is required"}), 400
            
            # Create contract
            contract = CustomerContract.create_contract(
                customer_id=customer_id,
                contract_type=data.get('contract_type'),
                puppy_id=data.get('puppy_id'),
                content=data.get('content'),
                document_url=data.get('document_url'),
                status=data.get('status', 'draft'),
                payment_status=data.get('payment_status', 'pending'),
                payment_method=data.get('payment_method'),
                payment_details=data.get('payment_details'),
                notes=data.get('notes')
            )
            
            return jsonify({"success": True, "data": contract[0] if contract else None}), 201
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/contracts/<int:contract_id>', methods=['PUT'])
    @token_required
    def update_contract(current_user, contract_id):
        """Update a contract"""
        try:
            data = request.json
            
            # Check if contract exists
            contract = CustomerContract.get_by_id(contract_id)
            if not contract:
                return jsonify({"success": False, "error": "Contract not found"}), 404
            
            # Remove any fields that are not part of the table schema
            fields_to_clean = ['customer_name', 'puppy_name', 'id', 'created_at']
            for field in fields_to_clean:
                if field in data:
                    del data[field]
            
            # Update contract
            updated_contract = CustomerContract.update_contract(contract_id, data)
            
            return jsonify({"success": True, "data": updated_contract[0] if updated_contract else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/contracts/<int:contract_id>', methods=['DELETE'])
    @token_required
    def delete_contract(current_user, contract_id):
        """Delete a contract"""
        try:
            # Check if contract exists
            contract = CustomerContract.get_by_id(contract_id)
            if not contract:
                return jsonify({"success": False, "error": "Contract not found"}), 404
            
            # Delete contract
            CustomerContract.delete_contract(contract_id)
            
            return jsonify({"success": True, "message": "Contract deleted successfully"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/contracts/<int:contract_id>/sign', methods=['PUT'])
    @token_required
    def sign_contract(current_user, contract_id):
        """Mark a contract as signed"""
        try:
            data = request.json
            
            # Check if contract exists
            contract = CustomerContract.get_by_id(contract_id)
            if not contract:
                return jsonify({"success": False, "error": "Contract not found"}), 404
            
            # Parse signing_date if provided
            signing_date = None
            if data.get('signing_date'):
                try:
                    signing_date = datetime.strptime(data.get('signing_date'), "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid signing date format. Use YYYY-MM-DD HH:MM:SS"}), 400
            
            # Mark contract as signed
            signed_contract = CustomerContract.mark_as_signed(contract_id, signing_date)
            
            return jsonify({"success": True, "data": signed_contract[0] if signed_contract else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @customers_bp.route('/contracts/<int:contract_id>/payment', methods=['PUT'])
    @token_required
    def update_payment_status(current_user, contract_id):
        """Update payment status for a contract"""
        try:
            data = request.json
            
            # Check if contract exists
            contract = CustomerContract.get_by_id(contract_id)
            if not contract:
                return jsonify({"success": False, "error": "Contract not found"}), 404
            
            # Validate required fields
            if 'payment_status' not in data:
                return jsonify({"success": False, "error": "Payment status is required"}), 400
            
            # Update payment status
            updated_contract = CustomerContract.update_payment_status(
                contract_id=contract_id,
                payment_status=data.get('payment_status'),
                payment_method=data.get('payment_method'),
                payment_details=data.get('payment_details')
            )
            
            return jsonify({"success": True, "data": updated_contract[0] if updated_contract else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return customers_bp