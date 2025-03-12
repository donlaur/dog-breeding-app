from datetime import datetime
from server.supabase_client import supabase

class Notification:
    """
    Notification model for storing user notifications
    """
    
    @staticmethod
    def get_all():
        response = supabase.table("notifications").select("*").execute()
        return response.data
    
    @staticmethod
    def get_by_user(user_id):
        response = supabase.table("notifications").select("*").eq("user_id", user_id).order("date", desc=True).execute()
        return response.data
    
    @staticmethod
    def get_by_id(notification_id):
        response = supabase.table("notifications").select("*").eq("id", notification_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def create(user_id, type, title, message, entity_id=None, entity_type=None):
        data = {
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "date": datetime.utcnow().isoformat(),
            "read": False
        }
        response = supabase.table("notifications").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update(notification_id, data):
        response = supabase.table("notifications").update(data).eq("id", notification_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def delete(notification_id):
        response = supabase.table("notifications").delete().eq("id", notification_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def mark_as_read(notification_id):
        response = supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def mark_all_as_read(user_id):
        response = supabase.table("notifications").update({"read": True}).eq("user_id", user_id).execute()
        return response.data
    
    @staticmethod
    def delete_all_for_user(user_id):
        response = supabase.table("notifications").delete().eq("user_id", user_id).execute()
        return response.data
