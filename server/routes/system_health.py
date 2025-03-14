"""
system_health.py

Simple system health check endpoint for Docker and monitoring services.
This is separate from the dog health records functionality.
"""

from flask import Blueprint, jsonify
from server.database.supabase_db import SupabaseDatabase

system_health_routes = Blueprint('system_health_routes', __name__)

@system_health_routes.route('/api/health', methods=['GET'])
def system_health_check():
    """
    Simple health check endpoint that verifies the API is running
    and can connect to the database.
    
    This endpoint is used by Docker healthchecks and monitoring systems
    to verify the application is functioning properly.
    """
    try:
        # Check database connection by performing a simple query
        # Using the established pattern for database queries
        db_status = "connected"
        db_error = None
        
        try:
            # Use find_by_field_values following the established pattern
            SupabaseDatabase().find_by_field_values("dog_breeds", {}, limit=1)
        except Exception as e:
            db_status = "error"
            db_error = str(e)
        
        return jsonify({
            "status": "healthy",
            "database": {
                "status": db_status,
                "error": db_error
            },
            "version": "1.0.0"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
