"""
auth.py

Blueprint for authentication routes (signup, login).
"""

from flask import Blueprint, request, jsonify
from server.config import debug_log

# Create a simple blueprint without factory pattern first
auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    debug_log("Auth signup endpoint hit")
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get data from request
    data = request.get_json()
    email = data.get('email', '')
    name = data.get('name', '')
    
    # For testing, just echo back the data
    return jsonify({
        'message': 'Signup endpoint hit',
        'data_received': {
            'email': email,
            'name': name
        },
        'token': 'test-token',
        'user': {
            'id': 1,
            'email': email,
            'name': name
        }
    }), 201

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    debug_log("Auth login endpoint hit")
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get data from request
    data = request.get_json()
    
    # For testing, just echo back the data
    return jsonify({
        'message': 'Login endpoint hit',
        'data_received': data,
        'token': 'test-token',
        'user': {
            'id': 1,
            'email': data.get('email')
        }
    }), 200 