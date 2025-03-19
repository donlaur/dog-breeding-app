"""
system_health.py

Simple system health check endpoint for Docker and monitoring services.
This is separate from the dog health records functionality.
"""

from flask import Blueprint, jsonify
from flask_cors import CORS
from server.database.supabase_db import SupabaseDatabase

def create_system_health_bp():
    """Create the system health blueprint"""
    system_health_bp = Blueprint('system_health', __name__)
    
    @system_health_bp.route('/', methods=['GET'])
    def system_health_check():
        """
        Simple health check endpoint that verifies the API is running
        and can connect to the database.

        This endpoint is used by Docker healthchecks and monitoring systems
        to verify the application is functioning properly.
        """
        try:
            # Check database connection by performing a simple query
            db_status = "connected"
            db_error = None

            try:
                # Try to initialize the database connection
                # This will throw an exception if it fails
                db = SupabaseDatabase()
                # Try a simple query
                db.find("dog_breeds")
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
    
    return system_health_bp