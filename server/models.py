import os
from datetime import datetime
from enum import Enum
from flask_bcrypt import generate_password_hash, check_password_hash
from server.supabase_client import supabase
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

# Enum for user roles
class UserRole(Enum):
    BUYER = "BUYER"
    BREEDER = "BREEDER"
    ADMIN = "ADMIN"

# User Model (Supabase-Based)
class User:
    def __init__(self, id, email, password_hash, role, location, contact_number, created_at=None, updated_at=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.location = location
        self.contact_number = contact_number
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "password_hash": self.password_hash,
            "role": self.role,
            "location": self.location,
            "contact_number": self.contact_number,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        }

    @staticmethod
    def get_by_email(email):
        response = supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_user(email, password, role, location, contact_number):
        password_hash = generate_password_hash(password).decode('utf-8')
        data = {
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "location": location,
            "contact_number": contact_number,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        }
        response = supabase.table("users").insert(data).execute()
        return response.data

# Breeding Program Model
class BreedingProgram:
    @staticmethod
    def get_all():
        response = supabase.table("breeding_programs").select("*").execute()
        return response.data

# Dog Breed Model
class DogBreed:
    @staticmethod
    def get_all():
        response = supabase.table("dog_breeds").select("*").execute()
        return response.data

# Dog Model
class Dog:
    @staticmethod
    def get_all():
        response = supabase.table("dogs").select("*").execute()
        return response.data

# Litter Model
class Litter:
    @staticmethod
    def get_all():
        response = supabase.table("litters").select("*").execute()
        return response.data

# Puppy Model
class Puppy:
    @staticmethod
    def get_all():
        response = supabase.table("puppies").select("*").execute()
        return response.data

# Contact Message Model
class ContactMessage:
    @staticmethod
    def get_all():
        response = supabase.table("contact_messages").select("*").execute()
        return response.data

# CMS Page Model
class Page:
    @staticmethod
    def get_all():
        response = supabase.table("pages").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(page_id):
        response = supabase.table("pages").select("*").eq("id", page_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_slug(slug):
        response = supabase.table("pages").select("*").eq("slug", slug).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def create_page(title, content, slug=None, template="default", status="published", meta_description=None):
        if not slug:
            # Generate slug from title
            slug = title.lower().replace(' ', '-')
        
        data = {
            "title": title,
            "content": content,
            "slug": slug,
            "template": template,
            "status": status,
            "meta_description": meta_description,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        }
        response = supabase.table("pages").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_page(page_id, data):
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("pages").update(data).eq("id", page_id).execute()
        return response.data
    
    @staticmethod
    def delete_page(page_id):
        response = supabase.table("pages").delete().eq("id", page_id).execute()
        return response.data

# Customer Model
class Customer:
    @staticmethod
    def get_all():
        response = supabase.table("customers").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(customer_id):
        response = supabase.table("customers").select("*").eq("id", customer_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_email(email):
        response = supabase.table("customers").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def create_customer(name, email=None, phone=None, address=None, city=None, state=None, zip_code=None, country=None, notes=None):
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "state": state,
            "zip": zip_code,
            "country": country,
            "notes": notes,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        }
        response = supabase.table("customers").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_customer(customer_id, data):
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("customers").update(data).eq("id", customer_id).execute()
        return response.data
    
    @staticmethod
    def delete_customer(customer_id):
        response = supabase.table("customers").delete().eq("id", customer_id).execute()
        return response.data
    
    @staticmethod
    def get_customer_puppies(customer_id):
        response = supabase.table("puppies").select("*").eq("customer_id", customer_id).execute()
        return response.data

# Health Record Model
class HealthRecord:
    @staticmethod
    def get_all():
        response = supabase.table("health_records").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("health_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("health_records").select("*").eq("dog_id", dog_id).order("record_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("health_records").select("*").eq("puppy_id", puppy_id).order("record_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def create_record(data):
        """Create a new health record"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("health_records").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_record(record_id, data):
        """Update an existing health record"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("health_records").update(data).eq("id", record_id).execute()
        return response.data
    
    @staticmethod
    def delete_record(record_id):
        """Delete a health record"""
        response = supabase.table("health_records").delete().eq("id", record_id).execute()
        return response.data

# Vaccination Model
class Vaccination:
    @staticmethod
    def get_all():
        response = supabase.table("vaccinations").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(vaccination_id):
        response = supabase.table("vaccinations").select("*").eq("id", vaccination_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("vaccinations").select("*").eq("dog_id", dog_id).order("administration_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("vaccinations").select("*").eq("puppy_id", puppy_id).order("administration_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_upcoming_vaccinations(days=30):
        """Get vaccinations due in the next X days"""
        today = datetime.utcnow()
        future_date = today + datetime.timedelta(days=days)
        
        response = supabase.table("vaccinations").select("*").gte("next_due_date", today.strftime("%Y-%m-%d")).lte("next_due_date", future_date.strftime("%Y-%m-%d")).execute()
        return response.data
    
    @staticmethod
    def create_vaccination(data):
        """Create a new vaccination record"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("vaccinations").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_vaccination(vaccination_id, data):
        """Update an existing vaccination record"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("vaccinations").update(data).eq("id", vaccination_id).execute()
        return response.data
    
    @staticmethod
    def delete_vaccination(vaccination_id):
        """Delete a vaccination record"""
        response = supabase.table("vaccinations").delete().eq("id", vaccination_id).execute()
        return response.data

# Weight Record Model
class WeightRecord:
    @staticmethod
    def get_all():
        response = supabase.table("weight_records").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("weight_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("weight_records").select("*").eq("dog_id", dog_id).order("measurement_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("weight_records").select("*").eq("puppy_id", puppy_id).order("measurement_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def create_record(data):
        """Create a new weight record"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("weight_records").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_record(record_id, data):
        """Update an existing weight record"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("weight_records").update(data).eq("id", record_id).execute()
        return response.data
    
    @staticmethod
    def delete_record(record_id):
        """Delete a weight record"""
        response = supabase.table("weight_records").delete().eq("id", record_id).execute()
        return response.data

# Medication Record Model
class MedicationRecord:
    @staticmethod
    def get_all():
        response = supabase.table("medication_records").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("medication_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("medication_records").select("*").eq("dog_id", dog_id).order("administration_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("medication_records").select("*").eq("puppy_id", puppy_id).order("administration_date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_active_medications():
        """Get currently active medications (those without an end_date or with end_date in the future)"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        response = supabase.table("medication_records").select("*").or(f"end_date.is.null,end_date.gt.{today}").execute()
        return response.data
    
    @staticmethod
    def create_record(data):
        """Create a new medication record"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("medication_records").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_record(record_id, data):
        """Update an existing medication record"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("medication_records").update(data).eq("id", record_id).execute()
        return response.data
    
    @staticmethod
    def delete_record(record_id):
        """Delete a medication record"""
        response = supabase.table("medication_records").delete().eq("id", record_id).execute()
        return response.data

# Health Condition Model
class HealthCondition:
    @staticmethod
    def get_all():
        response = supabase.table("health_conditions").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(condition_id):
        response = supabase.table("health_conditions").select("*").eq("id", condition_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("health_conditions").select("*").eq("dog_id", dog_id).execute()
        return response.data
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("health_conditions").select("*").eq("puppy_id", puppy_id).execute()
        return response.data
    
    @staticmethod
    def get_by_status(status):
        response = supabase.table("health_conditions").select("*").eq("status", status).execute()
        return response.data
    
    @staticmethod
    def create_condition(data):
        """Create a new health condition"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("health_conditions").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_condition(condition_id, data):
        """Update an existing health condition"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("health_conditions").update(data).eq("id", condition_id).execute()
        return response.data
    
    @staticmethod
    def delete_condition(condition_id):
        """Delete a health condition"""
        response = supabase.table("health_conditions").delete().eq("id", condition_id).execute()
        return response.data

# Health Condition Template Model
class HealthConditionTemplate:
    @staticmethod
    def get_all():
        response = supabase.table("health_condition_templates").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_id(template_id):
        response = supabase.table("health_condition_templates").select("*").eq("id", template_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_breed(breed_id):
        response = supabase.table("health_condition_templates").select("*").eq("breed_id", breed_id).execute()
        return response.data
    
    @staticmethod
    def create_template(data):
        """Create a new health condition template"""
        # Add timestamps
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = now
        data["updated_at"] = now
        
        response = supabase.table("health_condition_templates").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_template(template_id, data):
        """Update an existing health condition template"""
        # Add updated_at timestamp
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response = supabase.table("health_condition_templates").update(data).eq("id", template_id).execute()
        return response.data
    
    @staticmethod
    def delete_template(template_id):
        """Delete a health condition template"""
        response = supabase.table("health_condition_templates").delete().eq("id", template_id).execute()
        return response.data
