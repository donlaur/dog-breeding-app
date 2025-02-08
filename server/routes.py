# server/routes.py
from flask import Blueprint, request, jsonify
from server import db
from server.models import User

main_bp = Blueprint('main_bp', __name__)

@main_bp.route('/', methods=['GET'])
def index():
    return "Hello from Flask!"


@main_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@main_bp.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # Check if user exists
    existing = User.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({"error": "User already exists"}), 400
    
    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# More routes (login, dog/litter management) can be added here
