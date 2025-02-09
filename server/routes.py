from flask import Blueprint, request, jsonify
from server.models import db, ContactMessage, BreedingProgram, Dog, Litter, DogBreed
from datetime import datetime

main_bp = Blueprint("main_bp", __name__)

# ✅ Fetch the Single Breeder Program (Laur's Classic Corgis)
@main_bp.route("/api/breeder-program", methods=["GET"])
def get_breeder_program():
    """Fetch the single breeder program for the logged-in user (currently hardcoded to Laur's Classic Corgis)"""
    program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not program:
        return jsonify({"error": "Breeder program not found"}), 404
    return jsonify(program.to_dict())

# ✅ Update the Single Breeder Program
@main_bp.route("/api/breeder-program", methods=["PUT"])
def update_breeder_program():
    """Update the single breeder program"""
    program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not program:
        return jsonify({"error": "Breeder program not found"}), 404

    data = request.json
    program.name = data.get("name", program.name)
    program.description = data.get("description", program.description)
    program.facility_details = data.get("facility_details", program.facility_details)
    program.testimonial = data.get("testimonial", program.testimonial)
    program.contact_email = data.get("contact_email", program.contact_email)
    program.website = data.get("website", program.website)

    db.session.commit()
    return jsonify(program.to_dict())

# ✅ Fetch All Dogs (Linked to Laur's Classic Corgis)
@main_bp.route("/api/dogs", methods=["GET"])
def get_dogs():
    """Fetch all dogs belonging to Laur's Classic Corgis"""
    breeder_program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not breeder_program:
        return jsonify({"error": "Breeder program not found"}), 404

    dogs = Dog.query.filter_by(breeder_id=breeder_program.id).all()
    return jsonify([dog.to_dict() for dog in dogs])

# ✅ Add a Dog (Linked to Laur's Classic Corgis)
@main_bp.route("/api/dogs", methods=["POST"])
def create_dog():
    """Create a new dog linked to Laur's Classic Corgis"""
    data = request.json
    breeder_program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not breeder_program:
        return jsonify({"error": "Breeder program not found"}), 404

    if "breed_id" not in data or not data["breed_id"]:
        return jsonify({"error": "Breed is required"}), 400

    try:
        new_dog = Dog(
            registered_name=data["registered_name"],
            call_name=data["call_name"],
            breed_id=int(data["breed_id"]),  # ✅ Ensure breed_id is an integer
            gender=data["gender"],
            birth_date=datetime.strptime(data["birth_date"], "%Y-%m-%d").date(),  # ✅ Convert to Python date
            status=data["status"],
            breeder_id=breeder_program.id  # Auto-link to the breeder program
        )
        db.session.add(new_dog)
        db.session.commit()
        return jsonify(new_dog.to_dict()), 201
    except Exception as e:
        print(f"Error creating dog: {e}")  # Debugging log
        return jsonify({"error": str(e)}), 500
    
# ✅ Delete a Dog
@main_bp.route("/api/dogs/<int:dog_id>", methods=["DELETE"])
def delete_dog(dog_id):
    """Delete a dog"""
    dog = Dog.query.get_or_404(dog_id)
    db.session.delete(dog)
    db.session.commit()
    return jsonify({"message": "Dog deleted"}), 200

# ✅ Fetch All Litters (Linked to Laur's Classic Corgis)
@main_bp.route("/api/litters", methods=["GET"])
def get_litters():
    """Fetch all litters belonging to Laur's Classic Corgis"""
    breeder_program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not breeder_program:
        return jsonify({"error": "Breeder program not found"}), 404

    litters = Litter.query.filter_by(program_id=breeder_program.id).all()
    return jsonify([litter.to_dict() for litter in litters])

# ✅ Add a Litter (Linked to Laur's Classic Corgis)
@main_bp.route("/api/litters", methods=["POST"])
def create_litter():
    """Create a new litter, automatically linking it to Laur's Classic Corgis"""
    data = request.json
    breeder_program = BreedingProgram.query.filter_by(name="Laur's Classic Corgis").first()
    if not breeder_program:
        return jsonify({"error": "Breeder program not found"}), 404

    new_litter = Litter(
        program_id=breeder_program.id,  # Auto-link to breeder program
        breed_id=data["breed_id"],
        sire_id=data["sire_id"],
        dam_id=data["dam_id"],
        birth_date=data["birth_date"],
        num_puppies=data["num_puppies"],
    )
    db.session.add(new_litter)
    db.session.commit()
    return jsonify(new_litter.to_dict()), 201

# ✅ Delete a Litter
@main_bp.route("/api/litters/<int:litter_id>", methods=["DELETE"])
def delete_litter(litter_id):
    """Delete a litter"""
    litter = Litter.query.get_or_404(litter_id)
    db.session.delete(litter)
    db.session.commit()
    return jsonify({"message": "Litter deleted"}), 200

# ✅ Handle Contact Form Submission
@main_bp.route("/api/contact", methods=["POST"])
def contact():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")

    if not name or not email or not message:
        return jsonify({"error": "All fields are required"}), 400

    print(f"📩 New Contact Message: {name} ({email}) - {message}")

    return jsonify({"success": "Message received!"}), 200

# ✅ Fetch Contact Messages
@main_bp.route("/dashboard/messages", methods=["GET"])
def get_messages():
    try:
        messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
        return jsonify([msg.to_dict() for msg in messages]), 200
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({"error": str(e)}), 500

@main_bp.route("/api/breeds", methods=["GET"])
def get_breeds():
    """Fetch all dog breeds"""
    breeds = DogBreed.query.all()
    return jsonify([{"id": breed.id, "name": breed.name} for breed in breeds])
