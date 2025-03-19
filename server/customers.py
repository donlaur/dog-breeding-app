"""
Customers API for managing customer information.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.config import debug_log, debug_error
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
            
            debug_log(f"GET /customers with params: lead_status={lead_status}, lead_source={lead_source}")

            if lead_status:
                customers = Customer.get_by_lead_status(lead_status)
                debug_log(f"Fetched customers by lead_status={lead_status}, count: {len(customers)}")
            elif lead_source:
                customers = Customer.get_by_lead_source(lead_source)
                debug_log(f"Fetched customers by lead_source={lead_source}, count: {len(customers)}")
            else:
                customers = Customer.get_all()
                debug_log(f"Fetched all customers, count: {len(customers)}")

            return jsonify({"success": True, "data": customers}), 200
        except Exception as e:
            debug_error(f"Error fetching customers: {str(e)}")
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
                zip_code=data.get('zip_code'),  # Changed from 'zip' to match frontend
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
        """Get all puppies for a customer"""
        try:
            # Check if customer exists
            customer = Customer.get_by_id(customer_id)
            if not customer:
                return jsonify({"success": False, "error": "Customer not found"}), 404
                
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
                
            # Parse follow_up_date if provided
            if data.get('follow_up_date'):
                try:
                    data['follow_up_date'] = datetime.strptime(data.get('follow_up_date'), "%Y-%m-%d %H:%M:%S")
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
            deleted_communication = CustomerCommunication.delete_communication(communication_id)
            
            return jsonify({"success": True, "data": deleted_communication[0] if deleted_communication else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
            
    @customers_bp.route('/communications/upcoming', methods=['GET'])
    @token_required
    def get_upcoming_follow_ups(current_user):
        """Get upcoming follow-ups"""
        try:
            days = request.args.get('days', default=7, type=int)
            follow_ups = CustomerCommunication.get_upcoming_follow_ups(days)
            return jsonify({"success": True, "data": follow_ups}), 200
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
                
            if 'start_date' not in data:
                return jsonify({"success": False, "error": "Start date is required"}), 400
                
            # Parse dates
            try:
                start_date = datetime.strptime(data.get('start_date'), "%Y-%m-%d")
            except ValueError:
                return jsonify({"success": False, "error": "Invalid start date format. Use YYYY-MM-DD"}), 400
                
            end_date = None
            if data.get('end_date'):
                try:
                    end_date = datetime.strptime(data.get('end_date'), "%Y-%m-%d")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid end date format. Use YYYY-MM-DD"}), 400
                    
            # Create contract
            contract = CustomerContract.create_contract(
                customer_id=customer_id,
                contract_type=data.get('contract_type'),
                start_date=start_date,
                end_date=end_date,
                amount=data.get('amount'),
                status=data.get('status', 'draft'),
                terms=data.get('terms'),
                file_path=data.get('file_path')
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
                
            # Parse dates if provided
            if data.get('start_date'):
                try:
                    data['start_date'] = datetime.strptime(data.get('start_date'), "%Y-%m-%d")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid start date format. Use YYYY-MM-DD"}), 400
                    
            if data.get('end_date'):
                try:
                    data['end_date'] = datetime.strptime(data.get('end_date'), "%Y-%m-%d")
                except ValueError:
                    return jsonify({"success": False, "error": "Invalid end date format. Use YYYY-MM-DD"}), 400
                    
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
            deleted_contract = CustomerContract.delete_contract(contract_id)
            
            return jsonify({"success": True, "data": deleted_contract[0] if deleted_contract else None}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @customers_bp.route('/recent_leads', methods=['GET'])
    @token_required
    def get_recent_leads(current_user):
        """Get recent leads"""
        try:
            days = request.args.get('days', default=30, type=int)
            debug_log(f"GET /customers/recent_leads with days={days}")
            leads = Customer.get_recent_leads(days)
            debug_log(f"Found {len(leads)} recent leads in the last {days} days")
            return jsonify({"success": True, "data": leads}), 200
        except Exception as e:
            debug_error(f"Error fetching recent leads: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500

    return customers_bp