"""
Authentication utility functions for the server.
"""
from functools import wraps
from flask import request, jsonify, g
import jwt
from datetime import datetime, timedelta
import os

def login_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For development, we'll skip authentication
        # In production, this would validate JWT tokens
        return f(*args, **kwargs)
    return decorated_function

def generate_token(user_id):
    """Generate a JWT token for a user"""
    # This is a placeholder implementation
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, os.environ.get('JWT_SECRET', 'dev-secret'), algorithm='HS256')

def verify_token(token):
    """Verify a JWT token"""
    # This is a placeholder implementation
    try:
        payload = jwt.decode(token, os.environ.get('JWT_SECRET', 'dev-secret'), algorithms=['HS256'])
        return payload
    except:
        return None
