from flask import request, jsonify
from functools import wraps
import jwt
import os
import logging
import uuid

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # DEVELOPMENT MODE: Accept any token for testing purposes
        # In a production environment, this would properly validate the token
        try:
            # For development, create a mock user with a valid UUID instead of an integer
            # Using a fixed UUID for consistency in development
            mock_user_id = uuid.UUID('00000000-0000-4000-a000-000000000001')
            
            current_user = {
                'id': mock_user_id,  # Using UUID object instead of integer
                'email': 'demo@example.com',
                'name': 'Demo User',
                'created_at': '2023-01-01T00:00:00'
            }
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            return jsonify({'error': 'Token is invalid'}), 401
            
    return decorated