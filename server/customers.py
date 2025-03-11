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
import json

def create_customers_bp(db):
    customers_bp = Blueprint('customers', __name__)

    @customers_bp.route('', methods=['GET'])
    @token_required
    def get_customers(current_user):
        """Get all customers"""
        try:
            customers = Customer.get_all()
            return jsonify({"success": True, "data": customers}), 200
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
            
            customer = Customer.create_customer(
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                zip_code=data.get('zip'),
                country=data.get('country'),
                notes=data.get('notes')
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
    
    return customers_bp