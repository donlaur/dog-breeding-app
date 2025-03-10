"""
Messages API for handling communications between breeding program and leads/customers.
Supports text messaging and media attachments (photos, videos).
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.models.message import Message
from server.models.lead import Lead
from server.models import Customer
import json
import base64
import io

# Create the Blueprint
messages_bp = Blueprint('messages', __name__)

@messages_bp.route('', methods=['GET'])
@token_required
def get_messages(current_user):
    """Get messages with optional filtering"""
    try:
        lead_id = request.args.get('lead_id')
        customer_id = request.args.get('customer_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        if lead_id:
            messages = Message.get_conversation('lead', lead_id, limit, offset)
        elif customer_id:
            messages = Message.get_conversation('customer', customer_id, limit, offset)
        else:
            messages = Message.get_all(limit, offset)
            
        return jsonify({"success": True, "data": messages}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching messages: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('/<int:message_id>', methods=['GET'])
@token_required
def get_message(current_user, message_id):
    """Get a specific message"""
    try:
        message = Message.get_by_id(message_id)
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        
        return jsonify({"success": True, "data": message}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching message {message_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('', methods=['POST'])
@token_required
def create_message(current_user):
    """Create a new message"""
    try:
        data = request.json
        
        # Validate required fields
        if 'content' not in data and 'media_data' not in data:
            return jsonify({"success": False, "error": "Either content or media_data is required"}), 400
            
        if 'lead_id' not in data and 'customer_id' not in data:
            return jsonify({"success": False, "error": "Either lead_id or customer_id is required"}), 400
        
        # Handle media uploads if present
        media_urls = None
        media_type = None
        message_type = data.get('message_type', 'text')
        
        if 'media_data' in data and data['media_data']:
            message_type = 'media'
            media_files = data['media_data']
            
            if not isinstance(media_files, list):
                media_files = [media_files]
            
            media_urls = []
            
            # Process each media file
            for media_item in media_files:
                if 'data_url' not in media_item or 'file_name' not in media_item:
                    continue
                    
                try:
                    # Extract base64 data and content type
                    data_url = media_item['data_url']
                    header, encoded = data_url.split(',', 1)
                    content_type = header.split(';')[0].split(':')[1]
                    
                    # Decode base64 data
                    binary_data = base64.b64decode(encoded)
                    
                    # Upload media
                    url = Message.upload_media(
                        file_data=binary_data,
                        file_name=media_item['file_name'],
                        file_type=content_type
                    )
                    
                    if url:
                        media_urls.append(url)
                        
                        # Set media type based on first successful upload
                        if not media_type:
                            if content_type.startswith('image/'):
                                media_type = 'image'
                            elif content_type.startswith('video/'):
                                media_type = 'video'
                            else:
                                media_type = 'document'
                except Exception as e:
                    current_app.logger.error(f"Error processing media: {str(e)}")
        
        # Create message
        message = Message.create_message(
            content=data.get('content', ''),
            sender_type=data.get('sender_type', 'breeder'),
            sender_id=current_user.get('id') if data.get('sender_type') == 'breeder' else data.get('sender_id'),
            lead_id=data.get('lead_id'),
            customer_id=data.get('customer_id'),
            message_type=message_type,
            media_urls=media_urls,
            media_type=media_type
        )
        
        return jsonify({"success": True, "data": message}), 201
    except Exception as e:
        current_app.logger.error(f"Error creating message: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('/mark-read/<int:message_id>', methods=['PUT'])
@token_required
def mark_message_read(current_user, message_id):
    """Mark a message as read"""
    try:
        message = Message.get_by_id(message_id)
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        
        updated_message = Message.mark_as_read(message_id)
        
        return jsonify({"success": True, "data": updated_message}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking message {message_id} as read: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('/mark-conversation-read', methods=['PUT'])
@token_required
def mark_conversation_read(current_user):
    """Mark all messages in a conversation as read"""
    try:
        data = request.json
        
        if 'entity_type' not in data or 'entity_id' not in data:
            return jsonify({"success": False, "error": "Entity type and ID are required"}), 400
            
        entity_type = data['entity_type']
        entity_id = data['entity_id']
        
        if entity_type not in ('lead', 'customer'):
            return jsonify({"success": False, "error": "Invalid entity type"}), 400
        
        success = Message.mark_conversation_as_read(entity_type, entity_id)
        
        return jsonify({"success": success}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking conversation as read: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """Get count of unread messages"""
    try:
        entity_type = request.args.get('entity_type')
        entity_id = request.args.get('entity_id')
        
        count = Message.get_unread_count(entity_type, entity_id)
        
        return jsonify({"success": True, "count": count}), 200
    except Exception as e:
        current_app.logger.error(f"Error getting unread count: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@messages_bp.route('/<int:message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, message_id):
    """Delete a message"""
    try:
        message = Message.get_by_id(message_id)
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        
        Message.delete_message(message_id)
        
        return jsonify({"success": True, "message": "Message deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting message {message_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
