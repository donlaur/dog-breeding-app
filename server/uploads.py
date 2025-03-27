"""
uploads.py

Blueprint for managing general file uploads.
"""

import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_uploads_bp(db: DatabaseInterface) -> Blueprint:
    uploads_bp = Blueprint("uploads_bp", __name__)
    
    # Helper function to check if file extension is allowed
    def allowed_file(filename):
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    # Helper function to generate a unique filename
    def generate_unique_filename(filename):
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        unique_name = f"{uuid.uuid4().hex}"
        return f"{unique_name}.{ext}" if ext else unique_name
    
    @uploads_bp.route("", methods=["GET"])
    def list_uploads():
        """
        List all files in the uploads directory
        
        Returns:
        - files: List of filenames in the uploads directory
        """
        try:
            upload_dir = os.path.join(current_app.root_path, 'uploads')
            
            # Create the directory if it doesn't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            # List all files in the directory
            files = []
            for filename in os.listdir(upload_dir):
                if os.path.isfile(os.path.join(upload_dir, filename)):
                    files.append(filename)
                    
            return jsonify({
                "ok": True,
                "files": files
            })
        except Exception as e:
            debug_log(f"Error listing files: {str(e)}")
            return jsonify({
                "ok": False,
                "error": f"Error listing files: {str(e)}"
            }), 500
    
    @uploads_bp.route("", methods=["POST"])
    def upload_file():
        """
        General file upload endpoint
        
        Expects:
        - file: The file to upload
        - type: The type of file (image, document, etc.)
        
        Returns:
        - url: The URL of the uploaded file
        - original_filename: The original filename
        """
        try:
            # Ensure the request has files
            if 'file' not in request.files:
                return jsonify({"error": "No file part in the request"}), 400
                
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
                
            if not allowed_file(file.filename):
                return jsonify({"error": "File type not allowed"}), 400
            
            # Get file type from form data
            file_type = request.form.get('type', 'general')
            
            # Secure the filename to prevent any malicious paths
            orig_filename = secure_filename(file.filename)
            
            # Generate a unique filename to prevent collisions
            unique_filename = generate_unique_filename(orig_filename)
            
            # Define the upload directory
            upload_dir = os.path.join(current_app.root_path, 'uploads', file_type)
            
            # Create directory if it doesn't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # Define the complete path for saving
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save the file
            file.save(file_path)
            
            # Generate the URL
            url = f"/uploads/{file_type}/{unique_filename}"
            
            # Return success response
            return jsonify({
                "ok": True,
                "data": {
                    "url": url,
                    "original_filename": orig_filename,
                    "file_type": file_type
                }
            })
            
        except Exception as e:
            debug_log(f"Error uploading file: {str(e)}")
            return jsonify({
                "ok": False,
                "error": f"Error uploading file: {str(e)}"
            }), 500
    
    return uploads_bp