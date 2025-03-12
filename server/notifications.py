from flask import Blueprint, request, jsonify, current_app, g
from server.models.notification import Notification
from server.utils.auth import login_required
from datetime import datetime
import json

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    """
    Get all notifications for the current user
    """
    try:
        user_id = g.user_id
        
        # Get notifications from database
        notifications = Notification.get_by_user(user_id)
        
        return jsonify(notifications), 200
    except Exception as e:
        current_app.logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({"error": str(e)}), 500

@notifications_bp.route('/api/notifications', methods=['POST'])
@login_required
def create_notification():
    """
    Create a new notification
    """
    try:
        user_id = g.user_id
        data = request.get_json()
        
        # Handle both client-side naming conventions
        entity_id = data.get('entityId') or data.get('related_id')
        entity_type = data.get('entityType') or data.get('type')
        
        # Create new notification
        notification = Notification.create(
            user_id=user_id,
            type=data.get('type'),
            title=data.get('title'),
            message=data.get('message'),
            entity_id=entity_id,
            entity_type=entity_type
        )
        
        return jsonify(notification), 201
    except Exception as e:
        current_app.logger.error(f"Error creating notification: {str(e)}")
        return jsonify({"error": str(e)}), 500

@notifications_bp.route('/api/notifications/<int:notification_id>', methods=['PUT'])
@login_required
def update_notification(notification_id):
    """
    Update a notification (mark as read)
    """
    try:
        user_id = g.user_id
        data = request.get_json()
        
        # Get notification
        notification = Notification.get_by_id(notification_id)
        
        if not notification or notification.get('user_id') != user_id:
            return jsonify({"error": "Notification not found"}), 404
        
        # Update notification
        if 'read' in data:
            updated = Notification.update(notification_id, {'read': data['read']})
            return jsonify(updated), 200
        else:
            return jsonify(notification), 200
    except Exception as e:
        current_app.logger.error(f"Error updating notification: {str(e)}")
        return jsonify({"error": str(e)}), 500

@notifications_bp.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """
    Delete a notification
    """
    try:
        user_id = g.user_id
        
        # Get notification
        notification = Notification.get_by_id(notification_id)
        
        if not notification or notification.get('user_id') != user_id:
            return jsonify({"error": "Notification not found"}), 404
        
        # Delete notification
        Notification.delete(notification_id)
        
        return jsonify({"message": "Notification deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting notification: {str(e)}")
        return jsonify({"error": str(e)}), 500

@notifications_bp.route('/api/notifications', methods=['DELETE'])
@login_required
def delete_all_notifications():
    """
    Delete all notifications for the current user
    """
    try:
        user_id = g.user_id
        
        # Delete all notifications for user
        Notification.delete_all_for_user(user_id)
        
        return jsonify({"message": "All notifications deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting all notifications: {str(e)}")
        return jsonify({"error": str(e)}), 500

@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_read():
    """
    Mark all notifications as read for the current user
    """
    try:
        user_id = g.user_id
        
        # Mark all notifications as read
        Notification.mark_all_as_read(user_id)
        
        return jsonify({"message": "All notifications marked as read"}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({"error": str(e)}), 500
