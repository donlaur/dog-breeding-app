from flask import Blueprint, jsonify, request
from .config import debug_log
from .database import DatabaseInterface, DatabaseError

def create_messages_bp(db: DatabaseInterface) -> Blueprint:
    messages_bp = Blueprint("messages_bp", __name__)

    @messages_bp.route("/dashboard/messages", methods=["GET"])
    def get_messages():
        debug_log("Fetching all messages...")
        try:
            messages = db.get_all("messages")
            debug_log(f"Found {len(messages)} messages")
            return jsonify(messages)
        except DatabaseError as e:
            debug_log(f"Error fetching messages: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @messages_bp.route("/messages", methods=["POST"])
    def create_message():
        debug_log("Creating new message...")
        try:
            data = request.get_json()
            debug_log(f"Message data received: {data}")
            message = db.create("messages", data)
            debug_log(f"Message created: {message}")
            return jsonify(message), 201
        except DatabaseError as e:
            debug_log(f"Error creating message: {str(e)}")
            return jsonify({"error": str(e)}), 500

    return messages_bp 