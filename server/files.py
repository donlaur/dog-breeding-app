"""
files.py

Blueprint for managing file uploads and retrievals for different entities.
Handles both photos and documents.
"""

import os
import uuid
import traceback
from flask import Blueprint, request, jsonify, make_response, current_app, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_files_bp(db: DatabaseInterface) -> Blueprint:
    files_bp = Blueprint("files_bp", __name__)
    
    # Helper function to check if file extension is allowed
    def allowed_image(filename):
        ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
    
    def allowed_document(filename):
        ALLOWED_DOC_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_DOC_EXTENSIONS
    
    # Helper function to generate a unique filename
    def generate_unique_filename(filename):
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        unique_name = f"{uuid.uuid4().hex}"
        return f"{unique_name}.{ext}" if ext else unique_name
    
    # Helper function to determine file type
    def get_file_type(filename):
        if not '.' in filename:
            return 'unknown'
            
        ext = filename.rsplit('.', 1)[1].lower()
        if ext in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
            return 'image'
        elif ext in {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv'}:
            return 'document'
        else:
            return 'unknown'
    
    # Helper function to save a file
    def save_file(file, entity_type, entity_id):
        if not file or file.filename == '':
            return None, "No file selected"
        
        filename = secure_filename(file.filename)
        file_type = get_file_type(filename)
        
        if file_type == 'image' and not allowed_image(filename):
            return None, "Image file type not allowed"
        elif file_type == 'document' and not allowed_document(filename):
            return None, "Document file type not allowed"
        elif file_type == 'unknown':
            return None, "File type not supported"
        
        try:
            # Generate a unique filename to prevent collisions
            unique_filename = generate_unique_filename(filename)
            
            # Define the upload directory
            base_upload_dir = os.path.join(current_app.root_path, 'uploads')
            upload_dir = os.path.join(base_upload_dir, file_type + 's')
            
            # Create directories if they don't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # Define the complete path for saving
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save the file
            file.save(file_path)
            
            # Generate the URL
            url = f"/uploads/{file_type}s/{unique_filename}"
            
            # Return the file info
            return {
                "url": url,
                "original_filename": filename,
                "file_type": file_type
            }, None
            
        except Exception as e:
            debug_log(f"Error saving file: {str(e)}")
            return None, str(e)
    
    @files_bp.route("/", methods=["POST"])
    def upload_file():
        try:
            # Ensure the request has files
            if 'file' not in request.files:
                return jsonify({"error": "No file part in the request"}), 400
                
            file = request.files['file']
            
            # Get entity type and ID from the form data
            entity_type = request.form.get('entity_type')
            entity_id = request.form.get('entity_id')
            is_cover = request.form.get('is_cover', 'false').lower() == 'true'
            caption = request.form.get('caption', '')
            order = request.form.get('order', '0')
            title = request.form.get('title', '')
            description = request.form.get('description', '')
            
            # Validate required fields
            if not entity_type or not entity_id:
                return jsonify({
                    "error": "Missing required fields: entity_type and entity_id"
                }), 400
                
            try:
                entity_id = int(entity_id)
                order = int(order)
            except ValueError:
                return jsonify({"error": "entity_id and order must be integers"}), 400
            
            # Save the file
            file_info, error = save_file(file, entity_type, entity_id)
            
            if error:
                return jsonify({"error": f"Failed to save file: {error}"}), 500
            
            file_type = file_info["file_type"]
            
            # Data for file record
            file_data = {
                "related_type": entity_type,
                "related_id": entity_id,
                "url": file_info["url"],
                "original_filename": file_info["original_filename"],
                "title": title or file_info["original_filename"],
                "description": description,
                "file_type": file_type
            }
            
            # If it's an image, store it in the photos table
            if file_type == 'image':
                photo_data = {
                    **file_data,
                    "is_cover": is_cover,
                    "order": order,
                    "caption": caption
                }
                
                # If this is a cover photo, first set all other photos as non-cover
                if is_cover:
                    try:
                        # Find all photos for this entity
                        photos = db.find_by_field_values("photos", {
                            "related_type": entity_type,
                            "related_id": entity_id
                        })
                        
                        # Update them all to not be cover photos
                        for photo in photos:
                            if photo["is_cover"]:
                                db.update("photos", photo["id"], {"is_cover": False})
                    except Exception as e:
                        debug_log(f"Error updating cover photos: {str(e)}")
                
                # Create the photo record
                record = db.create("photos", photo_data)
                
                # If this is the first photo, set it as the cover photo
                if not is_cover:
                    photos = db.find_by_field_values("photos", {
                        "related_type": entity_type,
                        "related_id": entity_id
                    })
                    
                    if len(photos) == 1:  # Only this new photo exists
                        db.update("photos", record["id"], {"is_cover": True})
                        record["is_cover"] = True
                
                # Update the entity's cover_photo field if this is a cover photo
                if record["is_cover"]:
                    table_name = {
                        "dog": "dogs",
                        "litter": "litters",
                        "puppy": "puppies"
                    }.get(entity_type)
                    
                    if table_name:
                        db.update(table_name, entity_id, {"cover_photo": record["url"]})
            
            # If it's a document, store it in the documents table
            elif file_type == 'document':
                # Check if documents table exists
                try:
                    documents_table = "documents"
                    # Create the document record
                    record = db.create(documents_table, file_data)
                except Exception as e:
                    debug_log(f"Error creating document record: {str(e)}")
                    # Create documents table if it doesn't exist
                    return jsonify({
                        "error": "Documents table doesn't exist yet. Please run the documents migration first."
                    }), 500
            
            return jsonify(record), 201
            
        except Exception as e:
            debug_log(f"Error uploading file: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    @files_bp.route("/documents/<entity_type>/<int:entity_id>", methods=["GET"])
    def get_documents(entity_type, entity_id):
        try:
            # Check if documents table exists
            try:
                # Get all documents for the entity
                documents = db.find_by_field_values("documents", {
                    "related_type": entity_type,
                    "related_id": entity_id
                })
                
                return jsonify(documents), 200
            except Exception as e:
                debug_log(f"Error getting documents: {str(e)}")
                return jsonify({
                    "error": "Documents table doesn't exist yet. Please run the documents migration first."
                }), 500
                
        except Exception as e:
            debug_log(f"Error getting documents: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @files_bp.route("/documents/<int:document_id>", methods=["DELETE"])
    def delete_document(document_id):
        try:
            # Check if document exists
            document = db.get("documents", document_id)
            
            if not document:
                return jsonify({"error": f"Document with ID {document_id} not found"}), 404
            
            # Delete the physical file if it exists
            if document["url"] and document["url"].startswith("/uploads/"):
                try:
                    file_path = os.path.join(
                        current_app.root_path, 
                        document["url"].lstrip("/")
                    )
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    debug_log(f"Error deleting file: {str(e)}")
                    # Continue anyway, as we want to delete the DB record
            
            # Delete the document record
            db.delete("documents", document_id)
            
            return jsonify({"message": "Document deleted successfully"}), 200
            
        except Exception as e:
            debug_log(f"Error deleting document: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @files_bp.route("/documents/<int:document_id>", methods=["PUT"])
    def update_document(document_id):
        try:
            # Check if document exists
            document = db.get("documents", document_id)
            
            if not document:
                return jsonify({"error": f"Document with ID {document_id} not found"}), 404
            
            # Get data from request
            data = request.get_json()
            
            # Only allow updating title and description
            update_data = {}
            if "title" in data:
                update_data["title"] = data["title"]
            if "description" in data:
                update_data["description"] = data["description"]
            
            # Update the document
            updated_document = db.update("documents", document_id, update_data)
            
            return jsonify(updated_document), 200
            
        except Exception as e:
            debug_log(f"Error updating document: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    # Serve static files from the uploads directory
    @files_bp.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(
            os.path.join(current_app.root_path, 'uploads'),
            filename
        )
    
    return files_bp