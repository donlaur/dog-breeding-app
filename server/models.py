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
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(customer_id):
        response = supabase.table("customers").select("*").eq("id", customer_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_email(email):
        response = supabase.table("customers").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def create_customer(name, email=None, phone=None, address=None, city=None, state=None, zip_code=None, country=None, notes=None, lead_status=None, lead_source=None, preferred_contact_method=None, interests=None):
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "country": country,
            "notes": notes,
            "lead_status": lead_status,
            "lead_source": lead_source,
            "preferred_contact_method": preferred_contact_method,
            "interests": interests,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("customers").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_customer(customer_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("customers").update(data).eq("id", customer_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def delete_customer(customer_id):
        response = supabase.table("customers").delete().eq("id", customer_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_customer_puppies(customer_id):
        response = supabase.table("puppies").select("*").eq("customer_id", customer_id).execute()
        return response.data if response.data else []
        
    @staticmethod
    def get_by_lead_status(lead_status):
        response = supabase.table("customers").select("*").eq("lead_status", lead_status).execute()
        return response.data if response.data else []
        
    @staticmethod
    def get_by_lead_source(lead_source):
        response = supabase.table("customers").select("*").eq("lead_source", lead_source).execute()
        return response.data if response.data else []
        
    @staticmethod
    def get_recent_leads(days=30):
        # Calculate date from days ago
        from datetime import timedelta
        date_from = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        response = supabase.table("customers").select("*").gte("created_at", date_from).execute()
        return response.data if response.data else []

# Customer Communication Model
class CustomerCommunication:
    @staticmethod
    def get_all():
        response = supabase.table("customer_communications").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(communication_id):
        response = supabase.table("customer_communications").select("*").eq("id", communication_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_customer(customer_id):
        response = supabase.table("customer_communications").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
        return response.data if response.data else []
    
    @staticmethod
    def create_communication(customer_id, communication_type, subject=None, content=None, initiated_by=None, follow_up_date=None, notes=None):
        data = {
            "customer_id": customer_id,
            "communication_type": communication_type,
            "subject": subject,
            "content": content,
            "initiated_by": initiated_by,
            "follow_up_date": follow_up_date.strftime("%Y-%m-%d %H:%M:%S") if follow_up_date else None,
            "notes": notes,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("customer_communications").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_communication(communication_id, data):
        if "follow_up_date" in data and data["follow_up_date"] and isinstance(data["follow_up_date"], datetime):
            data["follow_up_date"] = data["follow_up_date"].strftime("%Y-%m-%d %H:%M:%S")
            
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("customer_communications").update(data).eq("id", communication_id).execute()
        return response.data
    
    @staticmethod
    def delete_communication(communication_id):
        response = supabase.table("customer_communications").delete().eq("id", communication_id).execute()
        return response.data
    
    @staticmethod
    def get_upcoming_follow_ups(days=7):
        # Calculate date range
        from datetime import timedelta
        date_from = datetime.utcnow().strftime("%Y-%m-%d")
        date_to = (datetime.utcnow() + timedelta(days=days)).strftime("%Y-%m-%d")
        
        response = supabase.table("customer_communications").select("*").gte("follow_up_date", date_from).lte("follow_up_date", date_to).execute()
        return response.data if response.data else []

# Customer Contract Model
class CustomerContract:
    @staticmethod
    def get_all():
        response = supabase.table("customer_contracts").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(contract_id):
        response = supabase.table("customer_contracts").select("*").eq("id", contract_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_customer(customer_id):
        response = supabase.table("customer_contracts").select("*").eq("customer_id", customer_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def create_contract(customer_id, contract_type, start_date, end_date=None, amount=None, status="draft", terms=None, file_path=None):
        data = {
            "customer_id": customer_id,
            "contract_type": contract_type,
            "start_date": start_date.strftime("%Y-%m-%d") if isinstance(start_date, datetime) else start_date,
            "end_date": end_date.strftime("%Y-%m-%d") if isinstance(end_date, datetime) and end_date else end_date,
            "amount": amount,
            "status": status,
            "terms": terms,
            "file_path": file_path,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("customer_contracts").insert(data).execute()
        return response.data
    
    @staticmethod
    def update_contract(contract_id, data):
        if "start_date" in data and data["start_date"] and isinstance(data["start_date"], datetime):
            data["start_date"] = data["start_date"].strftime("%Y-%m-%d")
            
        if "end_date" in data and data["end_date"] and isinstance(data["end_date"], datetime):
            data["end_date"] = data["end_date"].strftime("%Y-%m-%d")
            
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("customer_contracts").update(data).eq("id", contract_id).execute()
        return response.data
    
    @staticmethod
    def delete_contract(contract_id):
        response = supabase.table("customer_contracts").delete().eq("id", contract_id).execute()
        return response.data

# Health Record Model
class HealthRecord:
    @staticmethod
    def get_all():
        response = supabase.table("health_records").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("health_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("health_records").select("*").eq("dog_id", dog_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("health_records").select("*").eq("puppy_id", puppy_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new health record
    def create_record(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_records").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing health record
    def update_record(record_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_records").update(data).eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a health record
    def delete_record(record_id):
        response = supabase.table("health_records").delete().eq("id", record_id).execute()
        return response.data[0] if response.data else None

# Vaccination Model
class Vaccination:
    @staticmethod
    def get_all():
        response = supabase.table("vaccinations").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(vaccination_id):
        response = supabase.table("vaccinations").select("*").eq("id", vaccination_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("vaccinations").select("*").eq("dog_id", dog_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("vaccinations").select("*").eq("puppy_id", puppy_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Get vaccinations due in the next X days
    def get_upcoming_vaccinations(days=30):
        from datetime import timedelta
        due_date_limit = (datetime.utcnow() + timedelta(days=days)).strftime("%Y-%m-%d")
        due_date_today = datetime.utcnow().strftime("%Y-%m-%d")
        
        response = supabase.table("vaccinations").select("*").gte("due_date", due_date_today).lte("due_date", due_date_limit).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new vaccination record
    def create_vaccination(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("vaccinations").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing vaccination record
    def update_vaccination(vaccination_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("vaccinations").update(data).eq("id", vaccination_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a vaccination record
    def delete_vaccination(vaccination_id):
        response = supabase.table("vaccinations").delete().eq("id", vaccination_id).execute()
        return response.data[0] if response.data else None

# Weight Record Model
class WeightRecord:
    @staticmethod
    def get_all():
        response = supabase.table("weight_records").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("weight_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("weight_records").select("*").eq("dog_id", dog_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("weight_records").select("*").eq("puppy_id", puppy_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new weight record
    def create_record(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("weight_records").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing weight record
    def update_record(record_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("weight_records").update(data).eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a weight record
    def delete_record(record_id):
        response = supabase.table("weight_records").delete().eq("id", record_id).execute()
        return response.data[0] if response.data else None

# Medication Record Model
class MedicationRecord:
    @staticmethod
    def get_all():
        response = supabase.table("medication_records").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(record_id):
        response = supabase.table("medication_records").select("*").eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("medication_records").select("*").eq("dog_id", dog_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("medication_records").select("*").eq("puppy_id", puppy_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Get currently active medications (those without an end_date or with end_date in the future)
    def get_active_medications():
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        response = supabase.table("medication_records").select("*").or_([
            supabase.table("medication_records").column("end_date").gte(today),
            supabase.table("medication_records").column("end_date").is_(None)
        ]).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new medication record
    def create_record(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("medication_records").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing medication record
    def update_record(record_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("medication_records").update(data).eq("id", record_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a medication record
    def delete_record(record_id):
        response = supabase.table("medication_records").delete().eq("id", record_id).execute()
        return response.data[0] if response.data else None

# Health Condition Model
class HealthCondition:
    @staticmethod
    def get_all():
        response = supabase.table("health_conditions").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(condition_id):
        response = supabase.table("health_conditions").select("*").eq("id", condition_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_for_dog(dog_id):
        response = supabase.table("health_conditions").select("*").eq("dog_id", dog_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_for_puppy(puppy_id):
        response = supabase.table("health_conditions").select("*").eq("puppy_id", puppy_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_status(status):
        response = supabase.table("health_conditions").select("*").eq("status", status).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new health condition
    def create_condition(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_conditions").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing health condition
    def update_condition(condition_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_conditions").update(data).eq("id", condition_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a health condition
    def delete_condition(condition_id):
        response = supabase.table("health_conditions").delete().eq("id", condition_id).execute()
        return response.data[0] if response.data else None

# Health Condition Template Model
class HealthConditionTemplate:
    @staticmethod
    def get_all():
        response = supabase.table("health_condition_templates").select("*").execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(template_id):
        response = supabase.table("health_condition_templates").select("*").eq("id", template_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_breed(breed_id):
        response = supabase.table("health_condition_templates").select("*").eq("breed_id", breed_id).execute()
        return response.data if response.data else []
    
    @staticmethod
    # Create a new health condition template
    def create_template(data):
        data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_condition_templates").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Update an existing health condition template
    def update_template(template_id, data):
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("health_condition_templates").update(data).eq("id", template_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    # Delete a health condition template
    def delete_template(template_id):
        response = supabase.table("health_condition_templates").delete().eq("id", template_id).execute()
        return response.data[0] if response.data else None
