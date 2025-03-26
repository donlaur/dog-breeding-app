"""
photos.py

Blueprint for managing photo uploads and retrievals for different entities.
"""

import os
import uuid
import traceback
from flask import Blueprint, request, jsonify, make_response, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
from server.database.db_interface import DatabaseInterface
from .config import debug_log

def create_photos_bp(db: DatabaseInterface) -> Blueprint:
    photos_bp = Blueprint("photos_bp", __name__)
    
    # Helper function to check if file extension is allowed
    def allowed_file(filename):
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    # Helper function to generate a unique filename
    def generate_unique_filename(filename):
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        unique_name = f"{uuid.uuid4().hex}"
        return f"{unique_name}.{ext}" if ext else unique_name
    
    # Helper function to save a file
    def save_file(file, entity_type, entity_id):
        if not file or file.filename == '':
            return None, "No file selected"
            
        if not allowed_file(file.filename):
            return None, "File type not allowed"
        
        try:
            # Secure the filename to prevent any malicious paths
            orig_filename = secure_filename(file.filename)
            
            # Generate a unique filename to prevent collisions
            unique_filename = generate_unique_filename(orig_filename)
            
            # Define the upload directory
            upload_dir = os.path.join(current_app.root_path, 'uploads')
            
            # Create directory if it doesn't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # Define the complete path for saving
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save the file
            file.save(file_path)
            
            # Generate the URL
            url = f"/uploads/{unique_filename}"
            
            # Return the file URL and original filename
            return {
                "url": url,
                "original_filename": orig_filename
            }, None
            
        except Exception as e:
            debug_log(f"Error saving file: {str(e)}")
            return None, str(e)
    
    @photos_bp.route("/test", methods=["GET"])
    def test_photos_api():
        """Test endpoint to verify the photos API is working"""
        debug_log("Photos test endpoint accessed")

        # Include upload directory information for debugging
        uploads_dir = os.path.join(current_app.root_path, 'uploads')
        dir_exists = os.path.exists(uploads_dir)
        is_dir = os.path.isdir(uploads_dir) if dir_exists else False
        is_writable = os.access(uploads_dir, os.W_OK) if dir_exists else False
        
        try:
            # Try to list uploads directory contents for debugging
            uploads_contents = os.listdir(uploads_dir) if dir_exists else []
            dir_contents = len(uploads_contents)
        except Exception as e:
            uploads_contents = []
            dir_contents = f"Error: {str(e)}"
            
        # Check Cloudinary service status
        cloudinary_status = "not configured"
        if hasattr(current_app, 'config') and current_app.config.get('CLOUDINARY_SERVICE'):
            try:
                cloudinary_result = current_app.config['CLOUDINARY_SERVICE'].get_test_connectivity()
                cloudinary_status = cloudinary_result.get('status', 'unknown')
            except Exception as e:
                cloudinary_status = f"error: {str(e)}"

        return jsonify({
            "status": "success",
            "message": "Photos API is working correctly",
            "endpoints": [
                {"method": "POST", "path": "/api/photos", "description": "Upload a photo to local storage"},
                {"method": "POST", "path": "/api/photos/cloudinary", "description": "Upload a photo to Cloudinary"},
                {"method": "GET", "path": "/api/photos/<entity_type>/<entity_id>", "description": "Get photos for an entity"},
                {"method": "DELETE", "path": "/api/photos/<photo_id>", "description": "Delete a photo"},
                {"method": "PUT", "path": "/api/photos/<photo_id>", "description": "Update a photo"}
            ],
            "uploads_directory": {
                "path": uploads_dir,
                "exists": dir_exists,
                "is_directory": is_dir,
                "is_writable": is_writable,
                "contents_count": dir_contents,
                "contents": uploads_contents[:20] if len(uploads_contents) > 0 else "empty"
            },
            "cloudinary_status": cloudinary_status,
            "app_root": current_app.root_path
        }), 200
        
    @photos_bp.route("/cloudinary", methods=["POST"])
    def upload_to_cloudinary():
        """
        Endpoint to handle photo uploads to Cloudinary.
        """
        debug_log(f"Cloudinary upload endpoint called")
        
        try:
            # Check if Cloudinary service is available
            cloudinary_service = current_app.config.get('CLOUDINARY_SERVICE')
            if not cloudinary_service:
                debug_log("Error: Cloudinary service not configured")
                return jsonify({"error": "Cloudinary service not configured"}), 500
                
            # Ensure the request has files
            if 'file' not in request.files:
                debug_log("Error: No file found in request")
                return jsonify({"error": "No file part in the request"}), 400
                
            file = request.files['file']
            debug_log(f"File received: {file.filename}")
            
            # Get entity type and ID from the form data
            entity_type = request.form.get('entity_type')
            entity_id = request.form.get('entity_id')
            is_cover_str = request.form.get('is_cover')
            is_cover = is_cover_str.lower() == 'true' if is_cover_str is not None else False
            caption = request.form.get('caption', '')
            
            debug_log(f"Upload params - entity_type: {entity_type}, entity_id: {entity_id}, "
                     f"is_cover: {is_cover}, caption: '{caption}'")
            
            # Validate required fields
            if not entity_type or not entity_id:
                debug_log("Missing required fields: entity_type and entity_id")
                return jsonify({
                    "error": "Missing required fields: entity_type and entity_id"
                }), 400
                
            try:
                entity_id = int(entity_id)
            except ValueError as e:
                debug_log(f"Value error converting IDs: {str(e)}")
                return jsonify({"error": "entity_id must be an integer"}), 400
            
            # Save to a temporary file
            temp_file = os.path.join(current_app.root_path, 'uploads', f"temp_{uuid.uuid4().hex}")
            file.save(temp_file)
            
            try:
                # Upload to Cloudinary
                unique_id = f"{entity_type}_{entity_id}_{uuid.uuid4().hex[:8]}"
                options = {
                    "public_id": unique_id,
                    "tags": [entity_type, str(entity_id)]
                }
                
                result = cloudinary_service.upload_image(temp_file, entity_type, entity_id, options)
                debug_log(f"Cloudinary upload result: {result}")
                
                # Create a photo record in the database
                photo_data = {
                    "related_type": entity_type,
                    "related_id": entity_id,
                    "url": result["url"],
                    "original_filename": file.filename,
                    "is_cover": is_cover,
                    "caption": caption,
                    "order": 0,
                    "cloudinary_id": result["public_id"],
                    "thumbnail_url": result.get("thumbnail_url")
                }
                
                # If this is a cover photo, first set all other photos for this entity as non-cover
                if is_cover:
                    existing_photos = db.find_by_field_values("photos", {
                        "related_type": entity_type,
                        "related_id": entity_id
                    })
                    
                    for photo in existing_photos:
                        if photo["is_cover"]:
                            db.update("photos", photo["id"], {"is_cover": False})
                
                # Create the photo record
                photo = db.create("photos", photo_data)
                debug_log(f"Photo record created: {photo}")
                
                # Update the entity's cover_photo field if this is a cover photo
                if photo["is_cover"]:
                    table_name = {
                        "dog": "dogs",
                        "litter": "litters",
                        "puppy": "puppies"
                    }.get(entity_type)
                    
                    if table_name:
                        db.update(table_name, entity_id, {"cover_photo": photo["url"]})
                
                return jsonify(photo), 201
                
            finally:
                # Remove the temporary file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    
        except Exception as e:
            debug_log(f"Error uploading to Cloudinary: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
            
    @photos_bp.route("", methods=["POST"])
    @photos_bp.route("/", methods=["POST"])
    def upload_photo():
        debug_log(f"Photo upload endpoint called with method: {request.method}")
        debug_log(f"Content-Type: {request.content_type}")
        debug_log(f"Request URL: {request.url}")
        debug_log(f"Request path: {request.path}")
        debug_log(f"Request headers: {dict(request.headers)}")
        
        try:
            # Log request files and form data
            debug_log(f"Request files: {request.files.keys() if request.files else 'No files'}")
            debug_log(f"Request form data: {dict(request.form) if request.form else 'No form data'}")
            
            # Ensure the request has files
            if 'file' not in request.files:
                debug_log("Error: No file found in request")
                return jsonify({"error": "No file part in the request"}), 400
                
            file = request.files['file']
            debug_log(f"File received: {file.filename}")
            
            # Get entity type and ID from the form data
            entity_type = request.form.get('entity_type')
            entity_id = request.form.get('entity_id')
            # If is_cover isn't explicitly set, we'll determine it based on other photos
            is_cover_str = request.form.get('is_cover')
            is_cover = is_cover_str.lower() == 'true' if is_cover_str is not None else None
            caption = request.form.get('caption', '')
            order = request.form.get('order', '0')
            
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
                
            # Find all existing photos for this entity
            existing_photos = db.find_by_field_values("photos", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            # Determine if this should be a cover photo
            # If is_cover is None (not specified in the upload):
            # 1. If there are no existing photos, make it a cover (first photo is always cover)
            # 2. If there are existing photos, don't make it a cover (preserve existing cover)
            # This ensures uploading from Media Library won't change the cover photo status
            if is_cover is None:
                is_cover = len(existing_photos) == 0
                debug_log(f"is_cover not specified, setting to {is_cover} based on {len(existing_photos)} existing photos")
            
            # Create a new photo record
            photo_data = {
                "related_type": entity_type,
                "related_id": entity_id,
                "url": file_info["url"],
                "original_filename": file_info["original_filename"],
                "is_cover": is_cover,
                "order": order,
                "caption": caption
            }
            
            # If this is a cover photo, first set all other photos as non-cover
            if is_cover:
                try:
                    # Update them all to not be cover photos
                    for photo in existing_photos:
                        if photo["is_cover"]:
                            db.update("photos", photo["id"], {"is_cover": False})
                except Exception as e:
                    debug_log(f"Error updating cover photos: {str(e)}")
                    # Continue anyway, Supabase constraint should handle this
            
            # Create the photo record
            photo = db.create("photos", photo_data)
            
            # Update the entity's cover_photo field if this is a cover photo
            if photo["is_cover"]:
                table_name = {
                    "dog": "dogs",
                    "litter": "litters",
                    "puppy": "puppies"
                }.get(entity_type)
                
                if table_name:
                    # Check if the file exists before setting it as cover
                    file_path = None
                    if photo["url"].startswith("/uploads/"):
                        file_path = os.path.join(current_app.root_path, photo["url"].lstrip("/"))
                    
                    if not file_path or os.path.exists(file_path):
                        debug_log(f"Setting cover photo for {entity_type} {entity_id} to {photo['url']}")
                        db.update(table_name, entity_id, {"cover_photo": photo["url"]})
                    else:
                        debug_log(f"Warning: Cover photo file {file_path} does not exist")
            
            return jsonify(photo), 201
            
        except Exception as e:
            debug_log(f"Error uploading photo: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    @photos_bp.route("/<entity_type>/<int:entity_id>", methods=["GET"])
    def get_photos(entity_type, entity_id):
        try:
            # Get all photos for the entity
            photos = db.find_by_field_values("photos", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            # Sort by order field
            photos.sort(key=lambda p: p.get("order", 0))
            
            return jsonify(photos), 200
            
        except Exception as e:
            debug_log(f"Error getting photos: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @photos_bp.route("/<int:photo_id>", methods=["DELETE"])
    def delete_photo(photo_id):
        try:
            # Check if photo exists
            photo = db.get("photos", photo_id)
            
            if not photo:
                return jsonify({"error": f"Photo with ID {photo_id} not found"}), 404
            
            # Get entity type and ID before deleting
            entity_type = photo["related_type"]
            entity_id = photo["related_id"]
            was_cover = photo["is_cover"]
            
            # Delete the physical file if it exists
            if photo["url"] and photo["url"].startswith("/uploads/"):
                try:
                    file_path = os.path.join(
                        current_app.root_path, 
                        photo["url"].lstrip("/")
                    )
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    debug_log(f"Error deleting file: {str(e)}")
                    # Continue anyway, as we want to delete the DB record
            
            # Delete from Cloudinary if cloudinary_id is present
            if "cloudinary_id" in photo and photo["cloudinary_id"]:
                cloudinary_service = current_app.config.get('CLOUDINARY_SERVICE')
                if cloudinary_service:
                    try:
                        cloudinary_service.delete_image(photo["cloudinary_id"])
                        debug_log(f"Deleted image from Cloudinary: {photo['cloudinary_id']}")
                    except Exception as e:
                        debug_log(f"Error deleting from Cloudinary: {str(e)}")
                        # Continue anyway to delete the database record
            
            # Delete the photo record
            db.delete("photos", photo_id)
            
            # If this was a cover photo, set another photo as cover
            if was_cover:
                photos = db.find_by_field_values("photos", {
                    "related_type": entity_type,
                    "related_id": entity_id
                })
                
                if photos:  # There are other photos
                    # Set the first photo as cover
                    first_photo = photos[0]
                    db.update("photos", first_photo["id"], {"is_cover": True})
                    
                    # Update the entity's cover_photo field
                    table_name = {
                        "dog": "dogs",
                        "litter": "litters",
                        "puppy": "puppies"
                    }.get(entity_type)
                    
                    if table_name:
                        # Check if the file exists before setting it as cover
                        file_path = None
                        if first_photo["url"].startswith("/uploads/"):
                            file_path = os.path.join(current_app.root_path, first_photo["url"].lstrip("/"))
                        
                        if not file_path or os.path.exists(file_path):
                            debug_log(f"Setting new cover photo for {entity_type} {entity_id} to {first_photo['url']}")
                            db.update(table_name, entity_id, {"cover_photo": first_photo["url"]})
                        else:
                            debug_log(f"Warning: New cover photo file {file_path} does not exist")
                else:
                    # No other photos, clear the entity's cover_photo field
                    table_name = {
                        "dog": "dogs",
                        "litter": "litters",
                        "puppy": "puppies"
                    }.get(entity_type)
                    
                    if table_name:
                        db.update(table_name, entity_id, {"cover_photo": None})
            
            return jsonify({"message": "Photo deleted successfully"}), 200
            
        except Exception as e:
            debug_log(f"Error deleting photo: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @photos_bp.route("/<int:photo_id>/set-cover", methods=["POST"])
    def set_photo_as_cover(photo_id):
        try:
            # Check if photo exists
            photo = db.get("photos", photo_id)
            
            if not photo:
                return jsonify({"error": f"Photo with ID {photo_id} not found"}), 404
            
            # Get entity type and ID
            entity_type = photo["related_type"]
            entity_id = photo["related_id"]
            
            # Find all photos for this entity
            photos = db.find_by_field_values("photos", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            # Set all photos to not be cover
            for p in photos:
                if p["is_cover"]:
                    db.update("photos", p["id"], {"is_cover": False})
            
            # Set this photo as cover
            db.update("photos", photo_id, {"is_cover": True})
            
            # Update the entity's cover_photo field
            table_name = {
                "dog": "dogs",
                "litter": "litters",
                "puppy": "puppies"
            }.get(entity_type)
            
            if table_name:
                # Check if the file exists before setting it as cover
                file_path = None
                if photo["url"].startswith("/uploads/"):
                    file_path = os.path.join(current_app.root_path, photo["url"].lstrip("/"))
                
                if not file_path or os.path.exists(file_path):
                    debug_log(f"Setting cover photo for {entity_type} {entity_id} to {photo['url']}")
                    db.update(table_name, entity_id, {"cover_photo": photo["url"]})
                else:
                    debug_log(f"Warning: Cover photo file {file_path} does not exist")
            
            return jsonify({"message": "Photo set as cover successfully"}), 200
            
        except Exception as e:
            debug_log(f"Error setting photo as cover: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @photos_bp.route("/<int:photo_id>", methods=["PUT"])
    def update_photo(photo_id):
        try:
            # Check if photo exists
            photo = db.get("photos", photo_id)
            
            if not photo:
                return jsonify({"error": f"Photo with ID {photo_id} not found"}), 404
            
            # Get data from request
            data = request.get_json()
            
            # Only allow updating caption and order
            update_data = {}
            if "caption" in data:
                update_data["caption"] = data["caption"]
            if "order" in data:
                try:
                    update_data["order"] = int(data["order"])
                except ValueError:
                    return jsonify({"error": "order must be an integer"}), 400
            
            # Update the photo
            updated_photo = db.update("photos", photo_id, update_data)
            
            return jsonify(updated_photo), 200
            
        except Exception as e:
            debug_log(f"Error updating photo: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @photos_bp.route("/<entity_type>/<int:entity_id>/reorder", methods=["POST"])
    def reorder_photos(entity_type, entity_id):
        try:
            # Get data from request
            data = request.get_json()
            
            if not data or "photo_ids" not in data:
                return jsonify({"error": "Missing photo_ids field"}), 400
            
            photo_ids = data["photo_ids"]
            
            # Validate photo_ids is a list
            if not isinstance(photo_ids, list):
                return jsonify({"error": "photo_ids must be a list"}), 400
            
            # Get all photos for this entity
            photos = db.find_by_field_values("photos", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            # Create a map of photo IDs to photos
            photos_map = {str(p["id"]): p for p in photos}
            
            # Update the order of each photo
            for index, photo_id in enumerate(photo_ids):
                photo_id = str(photo_id)
                if photo_id in photos_map:
                    db.update("photos", int(photo_id), {"order": index})
            
            # Get updated photos
            updated_photos = db.find_by_field_values("photos", {
                "related_type": entity_type,
                "related_id": entity_id
            })
            
            # Sort by order field
            updated_photos.sort(key=lambda p: p.get("order", 0))
            
            return jsonify(updated_photos), 200
            
        except Exception as e:
            debug_log(f"Error reordering photos: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    return photos_bp