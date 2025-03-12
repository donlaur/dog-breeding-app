"""
test_photos.py

Tests for the Photos API endpoints.
"""

import pytest
import json
import os
import io
from flask import Flask
from server.photos import create_photos_bp
from server.auth.auth import token_required
from server.database.db_interface import DatabaseInterface

class TestPhotosAPI:
    """Test suite for Photos API endpoints."""

    @pytest.fixture
    def app(self, mock_db):
        """Create a Flask app with the photos blueprint."""
        app = Flask(__name__)
        
        # Create uploads directory for testing
        uploads_dir = os.path.join(app.root_path, 'uploads')
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
        
        # Register the photos blueprint
        photos_bp = create_photos_bp(mock_db)
        app.register_blueprint(photos_bp, url_prefix='/api/photos')
        
        # Mock the token_required decorator
        def mock_token_required(f):
            def decorated(*args, **kwargs):
                return f({"id": 1, "email": "test@example.com"}, *args, **kwargs)
            return decorated
        
        # Apply the mock decorator
        token_required.__code__ = mock_token_required.__code__
        
        return app

    @pytest.fixture
    def client(self, app):
        """Create a test client."""
        return app.test_client()

    @pytest.fixture
    def mock_db(self):
        """Create a mock database with pre-populated photos data."""
        class MockDatabase(DatabaseInterface):
            def __init__(self):
                self.data = {
                    "photos": [
                        {
                            "id": 1,
                            "related_type": "dog",
                            "related_id": 1,
                            "url": "/uploads/test_image1.jpg",
                            "original_filename": "dog_photo.jpg",
                            "is_cover": True,
                            "order": 1,
                            "caption": "Beautiful dog"
                        },
                        {
                            "id": 2,
                            "related_type": "dog",
                            "related_id": 1,
                            "url": "/uploads/test_image2.jpg",
                            "original_filename": "dog_photo2.jpg",
                            "is_cover": False,
                            "order": 2,
                            "caption": "Another dog photo"
                        },
                        {
                            "id": 3,
                            "related_type": "litter",
                            "related_id": 1,
                            "url": "/uploads/test_image3.jpg",
                            "original_filename": "litter_photo.jpg",
                            "is_cover": True,
                            "order": 1,
                            "caption": "Cute puppies"
                        }
                    ],
                    "dogs": [
                        {
                            "id": 1,
                            "call_name": "Fido",
                            "cover_photo": "/uploads/test_image1.jpg"
                        }
                    ],
                    "litters": [
                        {
                            "id": 1,
                            "litter_name": "Litter A",
                            "cover_photo": "/uploads/test_image3.jpg"
                        }
                    ],
                    "puppies": [
                        {
                            "id": 1,
                            "name": "Puppy 1",
                            "litter_id": 1,
                            "cover_photo": None
                        }
                    ]
                }
                self.next_id = {
                    "photos": 4
                }
            
            def find_by_field_values(self, table, filters):
                """Find records by field values."""
                if table not in self.data:
                    return []
                
                results = []
                for item in self.data[table]:
                    match = True
                    for key, value in filters.items():
                        if key not in item or item[key] != value:
                            match = False
                            break
                    if match:
                        results.append(item.copy())
                
                return results
            
            def find(self, table):
                """Find all records in a table."""
                if table not in self.data:
                    return []
                return [item.copy() for item in self.data[table]]
            
            def get(self, table, id):
                """Get a record by ID."""
                if table not in self.data:
                    return None
                
                for item in self.data[table]:
                    if item["id"] == id:
                        return item.copy()
                
                return None
            
            def create(self, table, data):
                """Create a new record."""
                if table not in self.data:
                    self.data[table] = []
                    self.next_id[table] = 1
                
                # Add ID if not provided
                if "id" not in data:
                    data["id"] = self.next_id[table]
                    self.next_id[table] += 1
                
                self.data[table].append(data)
                return data.copy()
            
            def update(self, table, id, data):
                """Update a record."""
                if table not in self.data:
                    return None
                
                for i, item in enumerate(self.data[table]):
                    if item["id"] == id:
                        # Update fields
                        for key, value in data.items():
                            self.data[table][i][key] = value
                        
                        return self.data[table][i].copy()
                
                return None
            
            def delete(self, table, id):
                """Delete a record."""
                if table not in self.data:
                    return False
                
                for i, item in enumerate(self.data[table]):
                    if item["id"] == id:
                        del self.data[table][i]
                        return True
                
                return False
        
        return MockDatabase()

    def test_upload_photo(self, client):
        """Test uploading a photo."""
        # Create a test image file
        image_data = b'fake image data'
        image_file = io.BytesIO(image_data)
        
        # Prepare form data
        data = {
            'file': (image_file, 'test_image.jpg'),
            'entity_type': 'dog',
            'entity_id': '1',
            'is_cover': 'false',
            'caption': 'Test caption',
            'order': '3'
        }
        
        # Send the request
        response = client.post(
            '/api/photos/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 201
        
        response_data = json.loads(response.data)
        assert response_data['related_type'] == 'dog'
        assert response_data['related_id'] == 1
        assert response_data['is_cover'] is False
        assert response_data['caption'] == 'Test caption'
        assert response_data['order'] == 3

    def test_upload_photo_as_cover(self, client):
        """Test uploading a photo as cover."""
        # Create a test image file
        image_data = b'fake image data'
        image_file = io.BytesIO(image_data)
        
        # Prepare form data
        data = {
            'file': (image_file, 'cover_image.jpg'),
            'entity_type': 'dog',
            'entity_id': '1',
            'is_cover': 'true',
            'caption': 'New cover photo',
            'order': '0'
        }
        
        # Send the request
        response = client.post(
            '/api/photos/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 201
        
        response_data = json.loads(response.data)
        assert response_data['is_cover'] is True
        
        # Check that the previous cover photo is no longer a cover
        previous_cover = self.mock_db().get("photos", 1)
        assert previous_cover['is_cover'] is False

    def test_upload_photo_missing_required_fields(self, client):
        """Test uploading a photo with missing required fields."""
        # Create a test image file
        image_data = b'fake image data'
        image_file = io.BytesIO(image_data)
        
        # Prepare form data with missing entity_id
        data = {
            'file': (image_file, 'test_image.jpg'),
            'entity_type': 'dog'
            # Missing entity_id
        }
        
        # Send the request
        response = client.post(
            '/api/photos/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 400
        
        response_data = json.loads(response.data)
        assert 'error' in response_data
        assert 'Missing required fields' in response_data['error']

    def test_get_photos(self, client):
        """Test getting photos for an entity."""
        # Test with valid entity
        response = client.get('/api/photos/dog/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['caption'] == 'Beautiful dog'
        assert data[1]['caption'] == 'Another dog photo'
        
        # Test with entity that has no photos
        response = client.get('/api/photos/dog/999')
        assert response.status_code == 200
        assert len(json.loads(response.data)) == 0

    def test_delete_photo(self, client):
        """Test deleting a photo."""
        # Test with valid photo ID
        response = client.delete('/api/photos/2')
        assert response.status_code == 200
        
        # Verify it's deleted
        photos = self.mock_db().find_by_field_values("photos", {"related_type": "dog", "related_id": 1})
        assert len(photos) == 1
        assert photos[0]['id'] == 1
        
        # Test with invalid photo ID
        response = client.delete('/api/photos/999')
        assert response.status_code == 404

    def test_delete_cover_photo(self, client):
        """Test deleting a cover photo."""
        # Test with valid cover photo ID
        response = client.delete('/api/photos/1')
        assert response.status_code == 200
        
        # Verify the next photo became the cover
        dog = self.mock_db().get("dogs", 1)
        assert dog['cover_photo'] is not None
        
        # Get the remaining photo
        photos = self.mock_db().find_by_field_values("photos", {"related_type": "dog", "related_id": 1})
        assert len(photos) == 1
        assert photos[0]['is_cover'] is True

    def test_set_photo_as_cover(self, client):
        """Test setting a photo as cover."""
        # Test with valid photo ID
        response = client.post('/api/photos/2/set-cover')
        assert response.status_code == 200
        
        # Verify the photo is now the cover
        photo = self.mock_db().get("photos", 2)
        assert photo['is_cover'] is True
        
        # Verify the previous cover is no longer a cover
        previous_cover = self.mock_db().get("photos", 1)
        assert previous_cover['is_cover'] is False
        
        # Verify the entity's cover_photo was updated
        dog = self.mock_db().get("dogs", 1)
        assert dog['cover_photo'] == photo['url']
        
        # Test with invalid photo ID
        response = client.post('/api/photos/999/set-cover')
        assert response.status_code == 404

    def test_update_photo(self, client):
        """Test updating a photo's metadata."""
        # Update data
        update_data = {
            "caption": "Updated caption",
            "order": 5
        }
        
        # Send update request
        response = client.put(
            '/api/photos/1',
            json=update_data
        )
        
        # Check response
        assert response.status_code == 200
        
        response_data = json.loads(response.data)
        assert response_data['caption'] == 'Updated caption'
        assert response_data['order'] == 5
        
        # Test with invalid photo ID
        response = client.put(
            '/api/photos/999',
            json=update_data
        )
        assert response.status_code == 404
        
        # Test with invalid order value
        invalid_data = {
            "order": "not a number"
        }
        
        response = client.put(
            '/api/photos/1',
            json=invalid_data
        )
        assert response.status_code == 400

    def test_reorder_photos(self, client):
        """Test reordering photos for an entity."""
        # Reorder data
        reorder_data = {
            "photo_ids": [2, 1]  # Reverse the order
        }
        
        # Send reorder request
        response = client.post(
            '/api/photos/dog/1/reorder',
            json=reorder_data
        )
        
        # Check response
        assert response.status_code == 200
        
        response_data = json.loads(response.data)
        assert len(response_data) == 2
        assert response_data[0]['id'] == 2  # First photo should now be ID 2
        assert response_data[1]['id'] == 1  # Second photo should now be ID 1
        
        # Test with missing photo_ids
        invalid_data = {}
        
        response = client.post(
            '/api/photos/dog/1/reorder',
            json=invalid_data
        )
        assert response.status_code == 400
        
        # Test with invalid photo_ids format
        invalid_data = {
            "photo_ids": "not a list"
        }
        
        response = client.post(
            '/api/photos/dog/1/reorder',
            json=invalid_data
        )
        assert response.status_code == 400
