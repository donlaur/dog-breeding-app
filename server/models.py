from datetime import datetime
from enum import Enum
from server import db
from flask_bcrypt import generate_password_hash, check_password_hash

# Enum for user roles
class UserRole(Enum):
    BUYER = "BUYER"
    BREEDER = "BREEDER"
    ADMIN = "ADMIN"

# User Model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.BUYER)
    location = db.Column(db.String(200))
    contact_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Breeding Program Model
class BreedingProgram(db.Model):
    __tablename__ = 'breeding_programs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    description = db.Column(db.Text)
    facility_details = db.Column(db.Text)
    testimonial = db.Column(db.Text)
    breeder_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    contact_email = db.Column(db.String(100))
    website = db.Column(db.String(200))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "facility_details": self.facility_details,
            "testimonial": self.testimonial,
            "breeder_id": self.breeder_id,
            "contact_email": self.contact_email,
            "website": self.website
        }

# Dog Breed Model
class DogBreed(db.Model):
    __tablename__ = 'dog_breeds'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    coat_colors = db.Column(db.Text)
    breed_type = db.Column(db.String(100))
    traits = db.Column(db.Text)

# Dog Model
class Dog(db.Model):
    __tablename__ = 'dogs'
    id = db.Column(db.Integer, primary_key=True)
    registered_name = db.Column(db.String(100), nullable=False)
    call_name = db.Column(db.String(50))
    breed_id = db.Column(db.Integer, db.ForeignKey('dog_breeds.id'), nullable=False)
    gender = db.Column(db.Enum('Male', 'Female', name='gender_enum'), nullable=False)
    birth_date = db.Column(db.Date)
    microchip_number = db.Column(db.String(30), unique=True)
    registration_number = db.Column(db.String(50), unique=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    breeder_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum('Upcoming', 'Active', 'Retired', name='dog_status_enum'), nullable=False)
    awards = db.Column(db.Text)
    pedigree_info = db.Column(db.Text)
    cover_photo = db.Column(db.String(200))
    photos = db.relationship('DogPhoto', backref='dog', lazy=True)

    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_dogs')
    breeder = db.relationship('User', foreign_keys=[breeder_id], backref='bred_dogs')

    def to_dict(self):
        return {
            "id": self.id,
            "registered_name": self.registered_name,
            "call_name": self.call_name,
            "breed_id": self.breed_id,
            "gender": self.gender,
            "birth_date": self.birth_date.strftime("%Y-%m-%d") if self.birth_date else None,
            "microchip_number": self.microchip_number,
            "registration_number": self.registration_number,
            "owner_id": self.owner_id,
            "breeder_id": self.breeder_id,
            "status": self.status,
            "awards": self.awards,
            "pedigree_info": self.pedigree_info,
            "cover_photo": self.cover_photo,
            "photos": [photo.photo_url for photo in self.photos]  # ✅ Include dog photos
        }

# Dog Photos
class DogPhoto(db.Model):
    __tablename__ = 'dog_photos'
    id = db.Column(db.Integer, primary_key=True)
    dog_id = db.Column(db.Integer, db.ForeignKey('dogs.id'), nullable=False)
    photo_url = db.Column(db.String(255), nullable=False)

# Litter Model
class Litter(db.Model):
    __tablename__ = 'litters'
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('breeding_programs.id'))
    breed_id = db.Column(db.Integer, db.ForeignKey('dog_breeds.id'))
    sire_id = db.Column(db.Integer, db.ForeignKey('dogs.id'))
    dam_id = db.Column(db.Integer, db.ForeignKey('dogs.id'))
    birth_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('Expected', 'Planned', 'Current', name='litter_status_enum'), nullable=False)
    num_puppies = db.Column(db.Integer)
    availability_date = db.Column(db.Date)

# Puppy Model
class Puppy(db.Model):
    __tablename__ = 'puppies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.Enum('Male', 'Female', name='gender_enum'), nullable=False)
    litter_id = db.Column(db.Integer, db.ForeignKey('litters.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    price = db.Column(db.Float)
    status = db.Column(db.Enum('Available', 'Reserved', 'Sold', name='puppy_status_enum'), nullable=False)

class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
