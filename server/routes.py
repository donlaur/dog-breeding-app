import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from server.models import db, Dog, BreedingProgram, ContactMessage, Litter, DogBreed, Puppy
from datetime import datetime

UPLOAD_FOLDER = "server/static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

main_bp = Blueprint("main_bp", __name__)

@main_bp.route("/api/dogs/<int:dog_id>", methods=["GET"])
def get_dog(dog_id):
    dog = Dog.query.get(dog_id)
    if not dog:
        return jsonify({"error": "Dog not found"}), 404
    return jsonify(dog.to_dict())

@main_bp.route("/api/dogs/<int:dog_id>", methods=["PUT"])
def update_dog(dog_id):
    """Update an existing dog, including replacing its cover photo if provided."""
    dog = Dog.query.get(dog_id)
    if not dog:
        return jsonify({"error": "Dog not found"}), 404

    data = request.form.to_dict()
    image_file = request.files.get("cover_photo")

    if "registered_name" in data:
        dog.registered_name = data["registered_name"]
    if "call_name" in data:
        dog.call_name = data["call_name"]
    if "breed_id" in data:
        dog.breed_id = int(data["breed_id"])
    if "gender" in data:
        dog.gender = data["gender"]
    if "birth_date" in data:
        dog.birth_date = datetime.strptime(data["birth_date"], "%Y-%m-%d").date()
    if "status" in data:
        dog.status = data["status"]

    db.session.commit()
    return jsonify(dog.to_dict())

@main_bp.route("/api/dogs/<int:dog_id>/upload", methods=["POST"])
def upload_dog_photo(dog_id):
    """Upload a cover photo for a dog and store it in the database as binary data."""
    dog = Dog.query.get(dog_id)
    if not dog:
        return jsonify({"error": "Dog not found"}), 404

    if "cover_photo" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["cover_photo"]
    dog.cover_photo = file.read()  # Store binary data in DB
    db.session.commit()
    return jsonify({"message": "File uploaded successfully"})

@main_bp.route("/api/litters", methods=["GET"])
def get_litters():
    litters = Litter.query.all()
    return jsonify([litter.to_dict() for litter in litters])

@main_bp.route("/api/messages", methods=["GET"])
def get_messages():
    messages = ContactMessage.query.all()
    return jsonify([message.to_dict() for message in messages])
