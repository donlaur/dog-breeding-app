"""
system_health.py

Simple system health check endpoint for Docker and monitoring services.
This is separate from the dog health records functionality.
"""

import sys
import os
from flask import Blueprint, jsonify
from flask_cors import CORS

def create_system_health_bp():
    """Create the system health blueprint"""
    system_health_bp = Blueprint('system_health', __name__)
    CORS(system_health_bp)  # Enable CORS for the health endpoint
    
    @system_health_bp.route('/', methods=['GET'])
    @system_health_bp.route('/health', methods=['GET'])  # Add an additional path for compatibility
    def system_health_check():
        """
        Enhanced health check endpoint that verifies:
        - API is running
        - Virtual environment status
        - Python version
        """
        try:
            # Check if running in virtual environment
            in_venv = sys.prefix != sys.base_prefix
            
            return jsonify({
                "status": "healthy",
                "environment": {
                    "virtual_env": in_venv,
                    "venv_path": sys.prefix if in_venv else None,
                    "python_version": sys.version,
                    "dev_mode": os.getenv("FLASK_ENV") == "development"
                },
                "version": "1.0.0"
            })
        except Exception as e:
            return jsonify({
                "status": "unhealthy",
                "error": str(e)
            }), 500
    
    return system_health_bp