"""
Messaging system Model for communication between breeding program and leads/customers.
Supports text messages and media attachments including photos and videos.
"""

from datetime import datetime
from server.supabase_client import supabase
import os
import uuid

# Message Type Enum values
MESSAGE_TYPE_TEXT = "text"
MESSAGE_TYPE_MEDIA = "media"
MESSAGE_TYPE_SYSTEM = "system"

# Message Sender Type Enum values
SENDER_TYPE_BREEDER = "breeder"  # Messages from breeding program
SENDER_TYPE_CUSTOMER = "customer"  # Messages from customers
SENDER_TYPE_LEAD = "lead"  # Messages from leads
SENDER_TYPE_SYSTEM = "system"  # System-generated messages

# Media Type Enum values for attachments
MEDIA_TYPE_IMAGE = "image"
MEDIA_TYPE_VIDEO = "video"
MEDIA_TYPE_DOCUMENT = "document"

class Message:
    @staticmethod
    def get_all(limit=100, offset=0):
        """Get all messages with pagination"""
        response = supabase.table("messages").select("*").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_by_id(message_id):
        """Get a message by ID"""
        response = supabase.table("messages").select("*").eq("id", message_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_conversation(entity_type, entity_id, limit=50, offset=0):
        """
        Get conversation for a specific entity (lead or customer)
        
        Args:
            entity_type: 'lead' or 'customer'
            entity_id: ID of the lead or customer
            limit: Maximum number of messages to return
            offset: Offset for pagination
            
        Returns:
            List of messages
        """
        if entity_type not in ('lead', 'customer'):
            return []
        
        column_name = f"{entity_type}_id"
        response = supabase.table("messages").select("*").eq(column_name, entity_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return response.data if response.data else []
    
    @staticmethod
    def create_message(content, sender_type, sender_id=None, lead_id=None, 
                      customer_id=None, message_type=MESSAGE_TYPE_TEXT, 
                      media_urls=None, media_type=None):
        """
        Create a new message
        
        Args:
            content: Message content text
            sender_type: Type of sender (breeder, customer, lead, system)
            sender_id: ID of the sender (user ID if breeder, customer/lead ID otherwise)
            lead_id: ID of the lead if this is a message in a lead conversation
            customer_id: ID of the customer if this is a message in a customer conversation
            message_type: Type of message (text, media, system)
            media_urls: JSON array of media URLs if message contains media
            media_type: Type of media if message contains media
            
        Returns:
            Created message
        """
        # Validate that either lead_id or customer_id is provided
        if not lead_id and not customer_id:
            raise ValueError("Either lead_id or customer_id must be provided")
        
        # Convert media_urls to string if it's a list
        if isinstance(media_urls, list):
            import json
            media_urls = json.dumps(media_urls)
            
        data = {
            "content": content,
            "sender_type": sender_type,
            "sender_id": sender_id,
            "lead_id": lead_id,
            "customer_id": customer_id,
            "message_type": message_type,
            "media_urls": media_urls,
            "media_type": media_type,
            "is_read": False,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = supabase.table("messages").insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def mark_as_read(message_id):
        """Mark a message as read"""
        data = {
            "is_read": True,
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("messages").update(data).eq("id", message_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def mark_conversation_as_read(entity_type, entity_id):
        """Mark all messages in a conversation as read"""
        if entity_type not in ('lead', 'customer'):
            return False
            
        column_name = f"{entity_type}_id"
        data = {
            "is_read": True,
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        response = supabase.table("messages").update(data).eq(column_name, entity_id).execute()
        return True
    
    @staticmethod
    def get_unread_count(entity_type=None, entity_id=None):
        """
        Get count of unread messages
        
        Args:
            entity_type: Optional. 'lead' or 'customer'
            entity_id: Optional. ID of the lead or customer
            
        Returns:
            Count of unread messages
        """
        query = supabase.table("messages").select("id").eq("is_read", False)
        
        if entity_type and entity_id:
            if entity_type not in ('lead', 'customer'):
                return 0
                
            column_name = f"{entity_type}_id"
            query = query.eq(column_name, entity_id)
            
        response = query.execute()
        return len(response.data) if response.data else 0
    
    @staticmethod
    def delete_message(message_id):
        """Delete a message"""
        response = supabase.table("messages").delete().eq("id", message_id).execute()
        return response.data[0] if response.data else None
        
    @staticmethod
    def upload_media(file_data, file_name, file_type):
        """
        Upload media to storage
        
        Args:
            file_data: Binary file data
            file_name: Original file name
            file_type: MIME type of the file
            
        Returns:
            URL of the uploaded file
        """
        try:
            # Generate a unique file name
            ext = os.path.splitext(file_name)[1]
            unique_name = f"{uuid.uuid4()}{ext}"
            
            # Determine the folder based on file type
            folder = "images"
            if file_type.startswith("video/"):
                folder = "videos"
            elif not file_type.startswith("image/"):
                folder = "documents"
                
            # Upload to Supabase Storage
            file_path = f"{folder}/{unique_name}"
            response = supabase.storage.from_("message_media").upload(
                file_path, 
                file_data,
                file_options={"contentType": file_type}
            )
            
            if response.error:
                raise Exception(response.error.message)
                
            # Get the public URL
            public_url = supabase.storage.from_("message_media").get_public_url(file_path)
            
            return public_url
        except Exception as e:
            print(f"Error uploading media: {str(e)}")
            return None
