from flask import request, jsonify
from functools import wraps
import jwt
import os

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
            
        try:
            # Verify token
            secret_key = os.environ.get('JWT_SECRET_KEY', 'development_secret_key')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            request.user_id = payload['user_id']
            request.user_email = payload['email']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(*args, **kwargs)
    
    return decorated 