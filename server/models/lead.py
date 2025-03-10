"""
Lead Management Model for the breeding program.
Represents potential customers in various stages of the sales funnel.
"""

from datetime import datetime
from server.supabase_client import supabase

# Lead Status Enum values
LEAD_STATUS_NEW = "new"
LEAD_STATUS_CONTACTED = "contacted"
LEAD_STATUS_QUALIFIED = "qualified"
LEAD_STATUS_NEGOTIATING = "negotiating"
LEAD_STATUS_CONVERTED = "converted"
LEAD_STATUS_LOST = "lost"

# Lead Source Enum values
LEAD_SOURCE_WEBSITE = "website"
LEAD_SOURCE_REFERRAL = "referral"
LEAD_SOURCE_SOCIAL_MEDIA = "social_media"
LEAD_SOURCE_EVENT = "event"
LEAD_SOURCE_OTHER = "other"

class Lead:
    @staticmethod
    def get_all():
        """Get all leads, ordered by creation date descending"""
        response = supabase.table("leads").select("*").order("created_at", desc=True).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(lead_id):
        """Get a lead by ID"""
        response = supabase.table("leads").select("*").eq("id", lead_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_email(email):
        """Get a lead by email address"""
        response = supabase.table("leads").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_status(status):
        """Get leads by status"""
        response = supabase.table("leads").select("*").eq("status", status).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_source(source):
        """Get leads by source"""
        response = supabase.table("leads").select("*").eq("source", source).execute()
        return response.data if response.data else []
    
    @staticmethod
    def create_lead(name, email, phone=None, source=LEAD_SOURCE_WEBSITE, 
                    status=LEAD_STATUS_NEW, address=None, city=None, 
                    state=None, zip_code=None, country=None, 
                    initial_message=None, preferred_contact=None,
                    interested_in=None, notes=None):
        """Create a new lead"""
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "source": source,
            "status": status,
            "address": address,
            "city": city,
            "state": state,
            "zip_code": zip_code, 
            "country": country,
            "initial_message": initial_message,
            "preferred_contact": preferred_contact,
            "interested_in": interested_in,
            "notes": notes,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("leads").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_lead(lead_id, data):
        """Update a lead"""
        data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        response = supabase.table("leads").update(data).eq("id", lead_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def delete_lead(lead_id):
        """Delete a lead"""
        response = supabase.table("leads").delete().eq("id", lead_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def convert_to_customer(lead_id):
        """Convert a lead to a customer"""
        # Get the lead
        lead = Lead.get_by_id(lead_id)
        if not lead:
            return None, "Lead not found"
        
        try:
            # Create customer from lead data
            from server.models import Customer
            customer = Customer.create_customer(
                name=lead.get("name"),
                email=lead.get("email"),
                phone=lead.get("phone"),
                address=lead.get("address"),
                city=lead.get("city"),
                state=lead.get("state"),
                zip_code=lead.get("zip_code"),
                country=lead.get("country"),
                notes=f"Converted from lead. {lead.get('notes', '')}"
            )
            
            # Update lead status to converted
            Lead.update_lead(lead_id, {
                "status": LEAD_STATUS_CONVERTED,
                "customer_id": customer.get("id") if customer else None
            })
            
            return customer, None
        except Exception as e:
            return None, str(e)
