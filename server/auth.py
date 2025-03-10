"""
auth.py

Blueprint for authentication and user account routes.
"""

from flask import Blueprint, request, jsonify
from server.config import debug_log
from datetime import datetime
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

# Simple token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Decode token (in a real app, verify signature with a secret key)
            # This is simplified for demo purposes
            current_user_id = 1  # For demo, we'll use a fixed user ID
            
            # Get user from database
            # In a real app, we'd query the database with the ID from the token
            current_user = {
                'id': current_user_id,
                'name': 'Demo User',
                'email': 'demo@example.com',
                'created_at': '2023-01-01T00:00:00',
                'password_hash': generate_password_hash('password')  # Demo password hash
            }
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            debug_log(f"Token verification error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
    
    return decorated

def create_auth_bp(db):
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
        password = data.get('password', '')
        
        # In a real implementation, we would:
        # 1. Validate data
        # 2. Check if user already exists
        # 3. Hash the password
        # 4. Create a new user in the database
        # 5. Generate a JWT token
        
        # For testing, just echo back the data with creation date
        return jsonify({
            'message': 'Signup successful',
            'token': 'test-token',
            'user': {
                'id': 1,
                'email': email,
                'name': name,
                'created_at': datetime.now().isoformat()
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
        email = data.get('email', '')
        password = data.get('password', '')
        
        # In a real implementation, we would:
        # 1. Validate data
        # 2. Look up user by email
        # 3. Verify password hash
        # 4. Generate a JWT token
        
        # Generate a real JWT token for testing
        import os
        import jwt
        from datetime import datetime, timedelta
        
        # Create token payload
        payload = {
            'user_id': 1,
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=1)  # Token expires in 1 day
        }
        
        # Get secret key from environment or use a default for development
        secret_key = os.environ.get('JWT_SECRET_KEY', 'development_secret_key')
        
        # Generate token
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        # For testing, return a demo user with the real token
        return jsonify({
            'token': token,
            'user': {
                'id': 1,
                'email': email,
                'name': 'Demo User',
                'created_at': '2023-01-01T00:00:00'
            }
        }), 200
    
    @auth_bp.route('/profile', methods=['GET'])
    @token_required
    def get_profile(current_user):
        debug_log("Auth profile endpoint hit")
        
        # Return the current user's profile
        # Remove sensitive fields
        user_data = {k: v for k, v in current_user.items() if k != 'password_hash'}
        
        return jsonify(user_data), 200
    
    @auth_bp.route('/profile', methods=['PUT', 'OPTIONS'])
    @token_required
    def update_profile(current_user):
        debug_log("Auth update profile endpoint hit")
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get data from request
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        
        # Update user fields (in a real app, validate and update in database)
        if name:
            current_user['name'] = name
        if email:
            current_user['email'] = email
        
        # Return updated user profile
        user_data = {k: v for k, v in current_user.items() if k != 'password_hash'}
        
        return jsonify(user_data), 200
    
    @auth_bp.route('/change-password', methods=['POST', 'OPTIONS'])
    @token_required
    def change_password(current_user):
        debug_log("Auth change password endpoint hit")
        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get data from request
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'message': 'Current and new password required'}), 400
        
        # Verify current password (in a real app, check against stored hash)
        if not check_password_hash(current_user['password_hash'], current_password):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Update password (in a real app, hash and store in database)
        # current_user['password_hash'] = generate_password_hash(new_password)
        
        return jsonify({'message': 'Password updated successfully'}), 200
        
    return auth_bp