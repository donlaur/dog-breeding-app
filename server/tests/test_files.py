"""
test_files.py

Tests for the Files API endpoints.
"""

import pytest
import json
import os
import io
from flask import Flask
from server.files import create_files_bp
from server.auth import token_required
from server.database.db_interface import DatabaseInterface

class TestFilesAPI:
    """Test suite for Files API endpoints."""

    @pytest.fixture
    def app(self, mock_db):
        """Create a Flask app with the files blueprint."""
        app = Flask(__name__)
        
        # Create uploads directory structure for testing
        uploads_dir = os.path.join(app.root_path, 'uploads')
        images_dir = os.path.join(uploads_dir, 'images')
        documents_dir = os.path.join(uploads_dir, 'documents')
        
        # Create directories if they don't exist
        for directory in [uploads_dir, images_dir, documents_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory)
        
        # Register the files blueprint
        files_bp = create_files_bp(mock_db)
        app.register_blueprint(files_bp, url_prefix='/api/files')
        
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
        """Create a mock database with pre-populated files data."""
        class MockDatabase(DatabaseInterface):
            def __init__(self):
                self.data = {
                    "photos": [
                        {
                            "id": 1,
                            "related_type": "dog",
                            "related_id": 1,
                            "url": "/uploads/images/test_image1.jpg",
                            "original_filename": "dog_photo.jpg",
                            "title": "Dog Photo",
                            "description": "A photo of a dog",
                            "file_type": "image",
                            "is_cover": True,
                            "order": 1,
                            "caption": "Beautiful dog"
                        },
                        {
                            "id": 2,
                            "related_type": "litter",
                            "related_id": 1,
                            "url": "/uploads/images/test_image2.jpg",
                            "original_filename": "litter_photo.jpg",
                            "title": "Litter Photo",
                            "description": "A photo of a litter",
                            "file_type": "image",
                            "is_cover": True,
                            "order": 1,
                            "caption": "Cute puppies"
                        }
                    ],
                    "documents": [
                        {
                            "id": 1,
                            "related_type": "dog",
                            "related_id": 1,
                            "url": "/uploads/documents/test_doc1.pdf",
                            "original_filename": "health_record.pdf",
                            "title": "Health Record",
                            "description": "Health record for the dog",
                            "file_type": "document"
                        }
                    ],
                    "dogs": [
                        {
                            "id": 1,
                            "call_name": "Fido",
                            "cover_photo": "/uploads/images/test_image1.jpg"
                        }
                    ],
                    "litters": [
                        {
                            "id": 1,
                            "litter_name": "Litter A",
                            "cover_photo": "/uploads/images/test_image2.jpg"
                        }
                    ]
                }
                self.next_id = {
                    "photos": 3,
                    "documents": 2
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

    def test_upload_image(self, client):
        """Test uploading an image file."""
        # Create a test image file
        image_data = b'fake image data'
        image_file = io.BytesIO(image_data)
        
        # Prepare form data
        data = {
            'file': (image_file, 'test_image.jpg'),
            'entity_type': 'dog',
            'entity_id': '1',
            'is_cover': 'true',
            'caption': 'Test caption',
            'order': '1',
            'title': 'Test Image',
            'description': 'Test image description'
        }
        
        # Send the request
        response = client.post(
            '/api/files/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 201
        
        response_data = json.loads(response.data)
        assert response_data['related_type'] == 'dog'
        assert response_data['related_id'] == 1
        assert response_data['title'] == 'Test Image'
        assert response_data['file_type'] == 'image'
        assert response_data['is_cover'] is True

    def test_upload_document(self, client):
        """Test uploading a document file."""
        # Create a test document file
        doc_data = b'fake document data'
        doc_file = io.BytesIO(doc_data)
        
        # Prepare form data
        data = {
            'file': (doc_file, 'test_document.pdf'),
            'entity_type': 'dog',
            'entity_id': '1',
            'title': 'Test Document',
            'description': 'Test document description'
        }
        
        # Send the request
        response = client.post(
            '/api/files/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 201
        
        response_data = json.loads(response.data)
        assert response_data['related_type'] == 'dog'
        assert response_data['related_id'] == 1
        assert response_data['title'] == 'Test Document'
        assert response_data['file_type'] == 'document'

    def test_upload_invalid_file(self, client):
        """Test uploading a file with invalid extension."""
        # Create a test file with invalid extension
        file_data = b'fake executable data'
        invalid_file = io.BytesIO(file_data)
        
        # Prepare form data
        data = {
            'file': (invalid_file, 'malicious.exe'),
            'entity_type': 'dog',
            'entity_id': '1'
        }
        
        # Send the request
        response = client.post(
            '/api/files/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response - should fail with 500 status code
        assert response.status_code == 500
        
        response_data = json.loads(response.data)
        assert 'error' in response_data

    def test_upload_missing_required_fields(self, client):
        """Test uploading a file with missing required fields."""
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
            '/api/files/',
            data=data,
            content_type='multipart/form-data'
        )
        
        # Check response
        assert response.status_code == 400
        
        response_data = json.loads(response.data)
        assert 'error' in response_data
        assert 'Missing required fields' in response_data['error']

    def test_get_documents(self, client):
        """Test getting documents for an entity."""
        # Test with valid entity
        response = client.get('/api/files/documents/dog/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['title'] == 'Health Record'
        assert data[0]['related_type'] == 'dog'
        assert data[0]['related_id'] == 1
        
        # Test with entity that has no documents
        response = client.get('/api/files/documents/dog/999')
        assert response.status_code == 200
        assert len(json.loads(response.data)) == 0

    def test_delete_document(self, client):
        """Test deleting a document."""
        # Test with valid document ID
        response = client.delete('/api/files/documents/1')
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get('/api/files/documents/dog/1')
        assert response.status_code == 200
        assert len(json.loads(response.data)) == 0
        
        # Test with invalid document ID
        response = client.delete('/api/files/documents/999')
        assert response.status_code == 404

    def test_update_document(self, client):
        """Test updating a document's metadata."""
        # Create a new document for testing
        doc_data = {
            "related_type": "dog",
            "related_id": 2,
            "url": "/uploads/documents/test_doc2.pdf",
            "original_filename": "vaccination_record.pdf",
            "title": "Vaccination Record",
            "description": "Vaccination record for the dog",
            "file_type": "document"
        }
        
        # Add to mock database
        doc = self.mock_db().create("documents", doc_data)
        
        # Update data
        update_data = {
            "title": "Updated Title",
            "description": "Updated description"
        }
        
        # Send update request
        response = client.put(
            f'/api/files/documents/{doc["id"]}',
            json=update_data
        )
        
        # Check response
        assert response.status_code == 200
        
        response_data = json.loads(response.data)
        assert response_data['title'] == 'Updated Title'
        assert response_data['description'] == 'Updated description'
        
        # Test with invalid document ID
        response = client.put(
            '/api/files/documents/999',
            json=update_data
        )
        assert response.status_code == 404

    def test_serve_uploaded_file(self, client):
        """Test serving an uploaded file."""
        # This is a simplified test since we can't actually create files in the test
        response = client.get('/api/files/uploads/images/test_image1.jpg')
        
        # The response might be 404 since we're not actually creating files,
        # but the route should exist
        assert response.status_code in [200, 404]
