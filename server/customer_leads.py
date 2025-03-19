"""
Customer Leads API for managing lead information.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.config import debug_log, debug_error

# Import the Customer model from models.py
import importlib.util
import os
spec = importlib.util.spec_from_file_location("models", os.path.join(os.path.dirname(__file__), "models.py"))
models_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_module)
Customer = models_module.Customer

def create_customer_leads_bp(db):
    customer_leads_bp = Blueprint('customer_leads', __name__)
    
    @customer_leads_bp.route('', methods=['GET'])
    @token_required
    def get_recent_leads(current_user):
        """Get recent leads"""
        try:
            days = request.args.get('days', default=30, type=int)
            debug_log(f"GET /recent_leads with days={days}")
            
            # Calculate date from days ago
            date_from = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
            
            # Query recent customers who are considered leads
            try:
                response = supabase.table("customers").select("*").gte("created_at", date_from).execute()
                leads = response.data if response.data else []
                debug_log(f"Found {len(leads)} recent leads in the last {days} days")
            except Exception as e:
                debug_error(f"Supabase query error: {str(e)}")
                leads = []
            
            return jsonify({"success": True, "data": leads}), 200
        except Exception as e:
            debug_error(f"Error fetching recent leads: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    return customer_leads_bp