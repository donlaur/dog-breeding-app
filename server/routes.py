from flask import Blueprint, request, jsonify
from server import db
from server.models import User, Dog, Litter, Puppy
from flask_jwt_extended import create_access_token

main_bp = Blueprint('main_bp', __name__)

# Health Check Route
@main_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Register a User
@main_bp.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    existing = User.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({"error": "User already exists"}), 400

    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"id": new_user.id, "email": new_user.email, "role": new_user.role.value}), 201

# Login Route
@main_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({"token": access_token}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# Get Available Puppies
@main_bp.route('/api/puppies', methods=['GET'])
def get_puppies():
    puppies = Puppy.query.filter_by(status='Available').all()
    return jsonify([{"id": p.id, "name": p.name, "price": p.price} for p in puppies])

# Get All Dogs
@main_bp.route('/api/dogs', methods=['GET'])
def get_dogs():
    dogs = Dog.query.all()
    return jsonify([{"id": d.id, "name": d.registered_name, "breed": d.breed_id} for d in dogs])
