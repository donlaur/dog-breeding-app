"""
test_notifications.py

Tests for the Notifications API endpoints.
"""

import pytest
import json
from datetime import datetime
from flask import Flask
from unittest.mock import patch, MagicMock
from server.notifications import notifications_bp
from server.models.notification import Notification

class TestNotificationsAPI:
    """Test suite for Notifications API endpoints."""

    @pytest.fixture
    def app(self):
        """Create a Flask app with the notifications blueprint."""
        app = Flask(__name__)
        app.register_blueprint(notifications_bp)
        return app

    @pytest.fixture
    def client(self, app):
        """Create a test client."""
        return app.test_client()

    @pytest.fixture
    def mock_auth(self):
        """Mock the login_required decorator."""
        patcher = patch('server.utils.auth.login_required', lambda f: lambda *args, **kwargs: f(*args, **kwargs))
        patcher.start()
        yield
        patcher.stop()

    @pytest.fixture
    def mock_user_id(self):
        """Mock the g.user_id value."""
        patcher = patch('flask.g', MagicMock(user_id=1))
        patcher.start()
        yield
        patcher.stop()

    @pytest.fixture
    def mock_notifications(self):
        """Mock notification data."""
        return [
            {
                "id": 1,
                "user_id": 1,
                "type": "litter_update",
                "title": "Litter Update",
                "message": "New puppies have been added to Litter A",
                "entity_id": 1,
                "entity_type": "litter",
                "read": False,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": 2,
                "user_id": 1,
                "type": "application_submitted",
                "title": "New Application",
                "message": "A new application has been submitted",
                "entity_id": 1,
                "entity_type": "application",
                "read": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]

    def test_get_notifications(self, client, mock_auth, mock_user_id, mock_notifications):
        """Test getting all notifications for the current user."""
        # Mock the Notification.get_by_user method
        with patch.object(Notification, 'get_by_user', return_value=mock_notifications):
            # Make the request
            response = client.get('/api/notifications')
            
            # Check the response
            assert response.status_code == 200
            data = json.loads(response.data)
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]['title'] == 'Litter Update'
            assert data[1]['title'] == 'New Application'

    def test_create_notification(self, client, mock_auth, mock_user_id):
        """Test creating a new notification."""
        # Mock notification data
        new_notification = {
            "id": 3,
            "user_id": 1,
            "type": "dog_update",
            "title": "Dog Update",
            "message": "Dog information has been updated",
            "entity_id": 1,
            "entity_type": "dog",
            "read": False,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Mock the Notification.create method
        with patch.object(Notification, 'create', return_value=new_notification):
            # Make the request
            request_data = {
                "type": "dog_update",
                "title": "Dog Update",
                "message": "Dog information has been updated",
                "entityId": 1,
                "entityType": "dog"
            }
            response = client.post('/api/notifications', json=request_data)
            
            # Check the response
            assert response.status_code == 201
            data = json.loads(response.data)
            assert data['id'] == 3
            assert data['title'] == 'Dog Update'
            assert data['type'] == 'dog_update'
            assert data['entity_id'] == 1
            assert data['entity_type'] == 'dog'

    def test_update_notification(self, client, mock_auth, mock_user_id, mock_notifications):
        """Test updating a notification (marking as read)."""
        # Mock the get_by_id and update methods
        with patch.object(Notification, 'get_by_id', return_value=mock_notifications[0]), \
             patch.object(Notification, 'update', return_value={**mock_notifications[0], "read": True}):
            # Make the request
            request_data = {"read": True}
            response = client.put('/api/notifications/1', json=request_data)
            
            # Check the response
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['id'] == 1
            assert data['read'] is True

    def test_update_notification_not_found(self, client, mock_auth, mock_user_id):
        """Test updating a notification that doesn't exist."""
        # Mock the get_by_id method to return None
        with patch.object(Notification, 'get_by_id', return_value=None):
            # Make the request
            request_data = {"read": True}
            response = client.put('/api/notifications/999', json=request_data)
            
            # Check the response
            assert response.status_code == 404
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not found' in data['error'].lower()

    def test_delete_notification(self, client, mock_auth, mock_user_id, mock_notifications):
        """Test deleting a notification."""
        # Mock the get_by_id and delete methods
        with patch.object(Notification, 'get_by_id', return_value=mock_notifications[0]), \
             patch.object(Notification, 'delete', return_value=True):
            # Make the request
            response = client.delete('/api/notifications/1')
            
            # Check the response
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'message' in data
            assert 'deleted successfully' in data['message'].lower()

    def test_delete_notification_not_found(self, client, mock_auth, mock_user_id):
        """Test deleting a notification that doesn't exist."""
        # Mock the get_by_id method to return None
        with patch.object(Notification, 'get_by_id', return_value=None):
            # Make the request
            response = client.delete('/api/notifications/999')
            
            # Check the response
            assert response.status_code == 404
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not found' in data['error'].lower()

    def test_delete_all_notifications(self, client, mock_auth, mock_user_id):
        """Test deleting all notifications for a user."""
        # Mock the delete_all_for_user method
        with patch.object(Notification, 'delete_all_for_user', return_value=True):
            # Make the request
            response = client.delete('/api/notifications')
            
            # Check the response
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'message' in data
            assert 'all notifications deleted' in data['message'].lower()

    def test_mark_all_read(self, client, mock_auth, mock_user_id):
        """Test marking all notifications as read for a user."""
        # Mock the mark_all_as_read method
        with patch.object(Notification, 'mark_all_as_read', return_value=True):
            # Make the request
            response = client.put('/api/notifications/read-all')
            
            # Check the response
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'message' in data
            assert 'all notifications marked as read' in data['message'].lower()

    def test_error_handling(self, client, mock_auth, mock_user_id):
        """Test error handling in the notifications endpoints."""
        # Mock the get_by_user method to raise an exception
        with patch.object(Notification, 'get_by_user', side_effect=Exception("Database error")):
            # Make the request
            response = client.get('/api/notifications')
            
            # Check the response
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert 'database error' in data['error'].lower()

    def test_database_query_pattern(self, client, mock_auth, mock_user_id):
        """Test that the correct database query pattern is used."""
        # This test ensures that the Notification model methods follow the correct pattern
        # by checking that they're called with the expected parameters
        
        # Test get_by_user
        with patch.object(Notification, 'get_by_user') as mock_get_by_user:
            client.get('/api/notifications')
            mock_get_by_user.assert_called_once_with(1)
        
        # Test get_by_id
        with patch.object(Notification, 'get_by_id') as mock_get_by_id, \
             patch.object(Notification, 'update', return_value={}):
            client.put('/api/notifications/1', json={"read": True})
            mock_get_by_id.assert_called_once_with(1)
        
        # Test create
        with patch.object(Notification, 'create') as mock_create:
            request_data = {
                "type": "test",
                "title": "Test",
                "message": "Test message",
                "entityId": 1,
                "entityType": "test"
            }
            client.post('/api/notifications', json=request_data)
            mock_create.assert_called_once()
            # Check that the correct parameters were passed
            call_args = mock_create.call_args[1]
            assert call_args['user_id'] == 1
            assert call_args['type'] == 'test'
            assert call_args['title'] == 'Test'
            assert call_args['message'] == 'Test message'
            assert call_args['entity_id'] == 1
            assert call_args['entity_type'] == 'test'
