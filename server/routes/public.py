"""
Public API routes that don't require authentication.
These endpoints handle contact form submissions and public messaging.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import uuid
from server.supabase_client import supabase
from server.models.lead import Lead, LEAD_STATUS_NEW, LEAD_SOURCE_WEBSITE

# Create the Blueprint
public_bp = Blueprint('public', __name__)

@public_bp.route('/contact', methods=['POST'])
def handle_contact_form():
    """Handle contact form submissions and create leads automatically"""
    try:
        data = request.json
        
        # Required fields validation
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Check if email already exists as a lead
        existing_lead = Lead.get_by_email(data['email'])
        
        if existing_lead:
            # Update the existing lead with new information
            lead_data = {
                "last_contacted": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "notes": f"{existing_lead.get('notes', '')} \n\nNew contact form message ({datetime.utcnow().strftime('%Y-%m-%d')}): {data['message']}"
            }
            
            # Update status if it was previously 'lost'
            if existing_lead.get('status') == 'lost':
                lead_data["status"] = LEAD_STATUS_NEW
                
            lead_result = Lead.update_lead(existing_lead['id'], lead_data)
            
            # Also create a message linked to this lead
            create_message_for_lead(existing_lead['id'], data['message'])
            
            return jsonify({
                "success": True, 
                "data": lead_result,
                "message": "Your existing information has been updated. We'll be in touch soon!"
            }), 200
        else:
            # Create a new lead
            lead_data = {
                "name": data['name'],
                "email": data['email'],
                "phone": data.get('phone', ''),
                "status": LEAD_STATUS_NEW,
                "source": LEAD_SOURCE_WEBSITE,
                "interest_type": data.get('interestType', 'general'),
                "notes": f"Initial contact form message: {data['message']}",
                "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "last_contacted": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            new_lead = Lead.create_lead(lead_data)
            
            # Create a message for this lead
            if new_lead and 'id' in new_lead:
                create_message_for_lead(new_lead['id'], data['message'])
            
            return jsonify({
                "success": True, 
                "data": new_lead,
                "message": "Thank you for your message! We'll be in touch soon."
            }), 201
            
    except Exception as e:
        print(f"Error in contact form submission: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

def create_message_for_lead(lead_id, content):
    """Create a message record linked to a lead"""
    try:
        message_data = {
            "lead_id": lead_id,
            "content": content,
            "sender_type": "lead",  # Message from lead
            "message_type": "text",
            "read": False,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = supabase.table("messages").insert(message_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error creating message for lead: {str(e)}")
        return None

@public_bp.route('/chat/register', methods=['POST'])
def register_for_chat():
    """Register a new chat user and create a lead if they don't already exist"""
    try:
        data = request.json
        
        # Required fields validation
        required_fields = ['name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Check if email already exists as a lead
        existing_lead = Lead.get_by_email(data['email'])
        lead_id = None
        
        if existing_lead:
            # Update the existing lead with new information
            lead_data = {
                "last_contacted": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "notes": f"{existing_lead.get('notes', '')} \n\nStarted chat session on {datetime.utcnow().strftime('%Y-%m-%d')}"
            }
            
            # Update status if it was previously 'lost'
            if existing_lead.get('status') == 'lost':
                lead_data["status"] = LEAD_STATUS_NEW
                
            lead_result = Lead.update_lead(existing_lead['id'], lead_data)
            lead_id = existing_lead['id']
        else:
            # Create a new lead
            lead_data = {
                "name": data['name'],
                "email": data['email'],
                "phone": data.get('phone', ''),
                "status": LEAD_STATUS_NEW,
                "source": LEAD_SOURCE_WEBSITE,
                "interest_type": data.get('interestType', 'general'),
                "notes": f"Started chat session on {datetime.utcnow().strftime('%Y-%m-%d')}",
                "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "last_contacted": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            new_lead = Lead.create_lead(lead_data)
            if new_lead and 'id' in new_lead:
                lead_id = new_lead['id']
        
        # Create a chat session
        session_id = str(uuid.uuid4())
        
        # Store chat session in database
        session_data = {
            "session_id": session_id,
            "lead_id": lead_id,
            "user_data": json.dumps(data),
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "last_activity": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "active"
        }
        
        session_response = supabase.table("chat_sessions").insert(session_data).execute()
        
        return jsonify({
            "success": True,
            "sessionId": session_id,
            "message": "Chat session started successfully"
        }), 201
            
    except Exception as e:
        print(f"Error in chat registration: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@public_bp.route('/chat/message', methods=['POST'])
def send_chat_message():
    """Handle sending a chat message from the widget"""
    try:
        data = request.json
        
        # Required fields validation
        required_fields = ['sessionId', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        session_id = data['sessionId']
        message_content = data['message']
        
        # Retrieve the chat session
        session_response = supabase.table("chat_sessions").select("*").eq("session_id", session_id).execute()
        
        if not session_response.data:
            return jsonify({"success": False, "error": "Chat session not found"}), 404
        
        session = session_response.data[0]
        lead_id = session['lead_id']
        
        # Update the session's last activity time
        supabase.table("chat_sessions").update({
            "last_activity": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }).eq("session_id", session_id).execute()
        
        # Store the message
        message_data = {
            "lead_id": lead_id,
            "chat_session_id": session_id,
            "content": message_content,
            "sender_type": "lead",  # Message from lead
            "message_type": "text",
            "read": False,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        message_response = supabase.table("messages").insert(message_data).execute()
        message_id = message_response.data[0]['id'] if message_response.data else None
        
        # Update the lead record to reflect recent contact
        Lead.update_lead(lead_id, {
            "last_contacted": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # Generate automatic response
        auto_response = "Thank you for your message! Our team will respond as soon as possible. In the meantime, feel free to ask any questions you have."
        
        return jsonify({
            "success": True,
            "messageId": message_id,
            "autoResponse": auto_response
        }), 200
            
    except Exception as e:
        print(f"Error sending chat message: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
