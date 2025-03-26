"""
cloudinary_service.py

Service for managing Cloudinary image uploads and transformations.
"""

import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
from flask import current_app

# Load environment variables
load_dotenv()

class CloudinaryService:
    """Service for interacting with Cloudinary API"""
    
    def __init__(self):
        """Initialize Cloudinary with credentials from environment variables"""
        # Load credentials from environment
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        if not all([cloud_name, api_key, api_secret]):
            current_app.logger.warning("Cloudinary credentials not fully configured")
        
        # Configure cloudinary
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        
        # Define folder structure for different entity types
        self.folder_structure = {
            'dog': 'dogs',
            'puppy': 'puppies',
            'litter': 'litters',
            'general': 'misc'
        }
    
    def upload_image(self, file_path, entity_type, entity_id, options=None):
        """
        Upload an image to Cloudinary
        
        Args:
            file_path (str): Path to the image file
            entity_type (str): Type of entity (dog, puppy, litter)
            entity_id (int, str): ID of the entity
            options (dict, optional): Additional options for upload
            
        Returns:
            dict: Upload result with URLs and metadata
        """
        try:
            # Determine folder based on entity type
            folder = f"{self.folder_structure.get(entity_type, 'misc')}/{entity_id}"
            
            # Default upload options
            default_options = {
                'folder': folder,
                'use_filename': True,
                'unique_filename': True,
                'overwrite': False,
                'resource_type': 'image',
                'tags': [entity_type, str(entity_id)],
                'eager': [
                    # Generate thumbnail and medium sizes automatically
                    {'width': 200, 'height': 200, 'crop': 'fill'},
                    {'width': 600, 'crop': 'scale'}
                ]
            }
            
            # Update with custom options if provided
            if options:
                default_options.update(options)
            
            current_app.logger.info(f"Uploading image to Cloudinary: {file_path}")
            
            # Upload the image
            result = cloudinary.uploader.upload(file_path, **default_options)
            
            current_app.logger.info(f"Upload successful: {result['public_id']}")
            
            # Extract and return relevant information
            return {
                'public_id': result['public_id'],
                'version': result['version'],
                'url': result['secure_url'],
                'thumbnail_url': self.get_image_url(
                    result['public_id'], 
                    {'width': 200, 'height': 200, 'crop': 'fill'}
                ),
                'format': result['format'],
                'resource_type': result['resource_type']
            }
            
        except Exception as e:
            current_app.logger.error(f"Cloudinary upload error: {str(e)}")
            raise
    
    def get_image_url(self, public_id, transformation=None):
        """
        Generate a URL for an image with optional transformations
        
        Args:
            public_id (str): Cloudinary public ID of the image
            transformation (dict, optional): Transformation options
            
        Returns:
            str: URL to the transformed image
        """
        options = {'secure': True}
        
        if transformation:
            options.update(transformation)
            
        return cloudinary.utils.cloudinary_url(public_id, **options)[0]
    
    def delete_image(self, public_id):
        """
        Delete an image from Cloudinary
        
        Args:
            public_id (str): Cloudinary public ID of the image
            
        Returns:
            dict: Deletion result
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result
        except Exception as e:
            current_app.logger.error(f"Cloudinary delete error: {str(e)}")
            raise
    
    def get_test_connectivity(self):
        """Test connectivity to Cloudinary API"""
        try:
            # Fetch account usage info - a lightweight call
            result = cloudinary.api.usage()
            return {
                'status': 'connected',
                'message': 'Successfully connected to Cloudinary API',
                'usage': result
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to connect to Cloudinary API: {str(e)}',
                'error': str(e)
            }