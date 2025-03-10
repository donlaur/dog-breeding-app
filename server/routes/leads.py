"""
Leads API for managing lead information and conversions.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.models.lead import Lead
import json

# Create the Blueprint
leads_bp = Blueprint('leads', __name__)

@leads_bp.route('', methods=['GET'])
@token_required
def get_leads(current_user):
    """Get all leads with optional filtering"""
    try:
        status = request.args.get('status')
        source = request.args.get('source')
        
        if status:
            leads = Lead.get_by_status(status)
        elif source:
            leads = Lead.get_by_source(source)
        else:
            leads = Lead.get_all()
            
        return jsonify({"success": True, "data": leads}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['GET'])
@token_required
def get_lead(current_user, lead_id):
    """Get a specific lead"""
    try:
        lead = Lead.get_by_id(lead_id)
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
        
        return jsonify({"success": True, "data": lead}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@leads_bp.route('', methods=['POST'])
@token_required
def create_lead(current_user):
    """Create a new lead"""
    try:
        data = request.json
        
        # Validate required fields
        if 'name' not in data:
            return jsonify({"success": False, "error": "Name is required"}), 400
            
        if 'email' not in data:
            return jsonify({"success": False, "error": "Email is required"}), 400
        
        # Check if lead with this email already exists
        existing_lead = Lead.get_by_email(data.get('email'))
        if existing_lead:
            return jsonify({
                "success": False, 
                "error": "A lead with this email already exists",
                "data": existing_lead
            }), 409
        
        lead = Lead.create_lead(
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            source=data.get('source'),
            status=data.get('status'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code'),
            country=data.get('country'),
            initial_message=data.get('initial_message'),
            preferred_contact=data.get('preferred_contact'),
            interested_in=data.get('interested_in'),
            notes=data.get('notes')
        )
        
        return jsonify({"success": True, "data": lead}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['PUT'])
@token_required
def update_lead(current_user, lead_id):
    """Update a lead"""
    try:
        data = request.json
        
        # Check if lead exists
        lead = Lead.get_by_id(lead_id)
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
        
        # Update lead
        updated_lead = Lead.update_lead(lead_id, data)
        
        return jsonify({"success": True, "data": updated_lead}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['DELETE'])
@token_required
def delete_lead(current_user, lead_id):
    """Delete a lead"""
    try:
        # Check if lead exists
        lead = Lead.get_by_id(lead_id)
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
        
        # Delete lead
        Lead.delete_lead(lead_id)
        
        return jsonify({"success": True, "message": "Lead deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@leads_bp.route('/<int:lead_id>/convert', methods=['POST'])
@token_required
def convert_lead_to_customer(current_user, lead_id):
    """Convert a lead to a customer"""
    try:
        # Check if lead exists and is not already converted
        lead = Lead.get_by_id(lead_id)
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
            
        if lead.get("status") == "converted":
            return jsonify({
                "success": False, 
                "error": "Lead is already converted to a customer",
                "customer_id": lead.get("customer_id")
            }), 400
        
        # Convert lead to customer
        customer, error = Lead.convert_to_customer(lead_id)
        
        if error:
            return jsonify({"success": False, "error": error}), 500
            
        return jsonify({
            "success": True, 
            "message": "Lead converted to customer successfully",
            "data": customer
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
