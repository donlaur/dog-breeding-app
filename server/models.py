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
