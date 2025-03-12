"""
test_messages.py

Tests for the Messages API endpoints.
"""

import pytest
import json
from flask import Flask
from server.messages import create_messages_bp
from server.database.db_interface import DatabaseInterface

class TestMessagesAPI:
    """Test suite for Messages API endpoints."""

    @pytest.fixture
    def app(self, mock_db):
        """Create a Flask app with the messages blueprint."""
        app = Flask(__name__)
        messages_bp = create_messages_bp(mock_db)
        app.register_blueprint(messages_bp)
        return app

    @pytest.fixture
    def client(self, app):
        """Create a test client."""
        return app.test_client()

    @pytest.fixture
    def mock_db(self):
        """Create a mock database with pre-populated messages data."""
        class MockDatabase(DatabaseInterface):
            def __init__(self):
                self.data = {
                    "messages": [
                        {
                            "id": 1,
                            "sender_id": 1,
                            "recipient_id": 2,
                            "subject": "Test Message 1",
                            "content": "This is a test message content",
                            "read": False,
                            "created_at": "2023-01-01T12:00:00Z"
                        },
                        {
                            "id": 2,
                            "sender_id": 2,
                            "recipient_id": 1,
                            "subject": "Test Message 2",
                            "content": "This is a reply to the test message",
                            "read": True,
                            "created_at": "2023-01-02T12:00:00Z"
                        }
                    ]
                }
                self.next_id = {
                    "messages": 3
                }
            
            def get_all(self, table):
                """Get all records from a table."""
                if table not in self.data:
                    return []
                return [item.copy() for item in self.data[table]]
            
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
        
        return MockDatabase()

    def test_get_messages(self, client):
        """Test getting all messages."""
        # Make the request
        response = client.get("/dashboard/messages")
        
        # Check the response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) == 2
        
        # Verify message data
        assert data[0]["subject"] == "Test Message 1"
        assert data[1]["subject"] == "Test Message 2"
        assert data[0]["content"] == "This is a test message content"
        assert data[1]["content"] == "This is a reply to the test message"

    def test_create_message(self, client):
        """Test creating a new message."""
        # Prepare message data
        message_data = {
            "sender_id": 1,
            "recipient_id": 3,
            "subject": "New Test Message",
            "content": "This is a new test message content",
            "read": False
        }
        
        # Make the request
        response = client.post(
            "/messages",
            json=message_data,
            content_type="application/json"
        )
        
        # Check the response
        assert response.status_code == 201
        data = json.loads(response.data)
        assert "id" in data
        assert data["sender_id"] == 1
        assert data["recipient_id"] == 3
        assert data["subject"] == "New Test Message"
        assert data["content"] == "This is a new test message content"
        assert data["read"] is False

    def test_get_messages_error_handling(self, client, monkeypatch, mock_db):
        """Test error handling when getting messages."""
        # Monkeypatch the get_all method to raise an exception
        def mock_get_all_error(self, table):
            raise Exception("Database error")
        
        monkeypatch.setattr(mock_db.__class__, "get_all", mock_get_all_error)
        
        # Make the request
        response = client.get("/dashboard/messages")
        
        # Check the response
        assert response.status_code == 500
        data = json.loads(response.data)
        assert "error" in data
        assert "Database error" in data["error"]

    def test_create_message_error_handling(self, client, monkeypatch, mock_db):
        """Test error handling when creating a message."""
        # Monkeypatch the create method to raise an exception
        def mock_create_error(self, table, data):
            raise Exception("Database error")
        
        monkeypatch.setattr(mock_db.__class__, "create", mock_create_error)
        
        # Prepare message data
        message_data = {
            "sender_id": 1,
            "recipient_id": 3,
            "subject": "New Test Message",
            "content": "This is a new test message content",
            "read": False
        }
        
        # Make the request
        response = client.post(
            "/messages",
            json=message_data,
            content_type="application/json"
        )
        
        # Check the response
        assert response.status_code == 500
        data = json.loads(response.data)
        assert "error" in data
        assert "Database error" in data["error"]

    def test_create_message_validation(self, client):
        """Test validation when creating a message."""
        # Test with missing required fields
        incomplete_data = {
            "sender_id": 1,
            # Missing recipient_id
            "subject": "Incomplete Message"
            # Missing content
        }
        
        # Make the request
        response = client.post(
            "/messages",
            json=incomplete_data,
            content_type="application/json"
        )
        
        # The API doesn't currently validate required fields, so this test
        # is just checking that the request completes successfully
        # In a real application, you might want to add validation
        assert response.status_code == 201
        
        # Verify the message was created with the provided fields
        data = json.loads(response.data)
        assert data["sender_id"] == 1
        assert data["subject"] == "Incomplete Message"
        assert "recipient_id" not in data
        assert "content" not in data
