from datetime import datetime
from enum import Enum
from server import db
from flask_bcrypt import generate_password_hash, check_password_hash

# Enum for user roles
class UserRole(Enum):
    BUYER = "BUYER"
    BREEDER = "BREEDER"
    ADMIN = "ADMIN"

# User Model (People Table)
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

# Table for Multiple Breeders per Program
breeder_program_association = db.Table(
    'breeder_program_association',
    db.Column('breeder_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('program_id', db.Integer, db.ForeignKey('breeding_programs.id'))
)

# Breeding Program Model
class BreedingProgram(db.Model):
    __tablename__ = 'breeding_programs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    description = db.Column(db.Text)
    facility_details = db.Column(db.Text)
    testimonial = db.Column(db.Text)
    breeder_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # Primary breeder
    breeders = db.relationship('User', secondary=breeder_program_association, backref='breeding_programs')

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
