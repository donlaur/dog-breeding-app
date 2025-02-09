import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from server.models import db, Dog, BreedingProgram, ContactMessage, Litter
from datetime import datetime

UPLOAD_FOLDER = "server/static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

main_bp = Blueprint("main_bp", __name__)

# ✅ Fetch all dogs
@main_bp.route("/api/dogs", methods=["GET"])
def get_dogs():
    dogs = Dog.query.all()
    return jsonify([dog.to_dict() for dog in dogs])

# ✅ Create Dog with Image Upload
@main_bp.route("/api/dogs", methods=["POST"])
def create_dog():
    """Create a new dog and handle image upload"""
    breeder_program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not breeder_program:
        return jsonify({"error": "Breeder program not found"}), 404

    data = request.form.to_dict()
    image_file = request.files.get("cover_photo")

    cover_photo_path = None
    if image_file and allowed_file(image_file.filename):
        filename = secure_filename(image_file.filename)
        cover_photo_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(cover_photo_path)
        cover_photo_path = f"/static/uploads/{filename}"

    try:
        new_dog = Dog(
            registered_name=data.get("registered_name"),
            call_name=data.get("call_name"),
            breed_id=int(data.get("breed_id")),
            gender=data.get("gender"),
            birth_date=datetime.strptime(data.get("birth_date"), "%Y-%m-%d").date(),
            status=data.get("status"),
            cover_photo=cover_photo_path,
            breeder_id=breeder_program.id
        )
        db.session.add(new_dog)
        db.session.commit()
        return jsonify(new_dog.to_dict()), 201
    except Exception as e:
        print(f"Error creating dog: {e}")
        return jsonify({"error": str(e)}), 500

# ✅ Update Dog with Image Upload
@main_bp.route("/api/dogs/<int:dog_id>", methods=["PUT"])
def update_dog(dog_id):
    """Update an existing dog and handle image upload"""
    dog = Dog.query.get_or_404(dog_id)
    data = request.form.to_dict()
    image_file = request.files.get("cover_photo")

    if image_file and allowed_file(image_file.filename):
        filename = secure_filename(image_file.filename)
        cover_photo_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(cover_photo_path)
        dog.cover_photo = f"/static/uploads/{filename}"

    dog.registered_name = data.get("registered_name", dog.registered_name)
    dog.call_name = data.get("call_name", dog.call_name)
    dog.breed_id = int(data.get("breed_id", dog.breed_id))
    dog.gender = data.get("gender", dog.gender)
    dog.birth_date = datetime.strptime(data.get("birth_date"), "%Y-%m-%d").date() if data.get("birth_date") else dog.birth_date
    dog.status = data.get("status", dog.status)

    db.session.commit()
    return jsonify(dog.to_dict()), 200

# ✅ Handle Contact Form Submission
@main_bp.route("/api/contact", methods=["POST"])
def contact():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")

    if not name or not email or not message:
        return jsonify({"error": "All fields are required"}), 400

    contact_message = ContactMessage(name=name, email=email, message=message)
    db.session.add(contact_message)
    db.session.commit()

    return jsonify({"success": "Message received!"}), 200

# ✅ Fetch Contact Messages
@main_bp.route("/api/contact/messages", methods=["GET"])
def get_messages():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([msg.to_dict() for msg in messages])

# ✅ Fetch all litters
@main_bp.route("/api/litters", methods=["GET"])
def get_litters():
    litters = Litter.query.all()
    return jsonify([litter.to_dict() for litter in litters])
