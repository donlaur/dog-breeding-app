"""
health.py

Simple health check endpoint for Docker and monitoring services.
"""

from flask import Blueprint, jsonify
from server.database import db

health_routes = Blueprint('health_routes', __name__)

@health_routes.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint that verifies the API is running
    and can connect to the database.
    """
    try:
        # Check database connection by performing a simple query
        # Using the established pattern for database queries
        db_status = "connected"
        db_error = None
        
        try:
            # Use find_by_field_values following the established pattern
            db.find_by_field_values("dog_breeds", {}, limit=1)
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
