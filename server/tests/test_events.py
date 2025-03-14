"""
test_events.py

Tests for the Events API endpoints.
"""

import pytest
import json
import datetime
from flask import Flask
from server.events import create_events_bp
from server.auth import token_required
from server.database.db_interface import DatabaseInterface

class TestEventsAPI:
    """Test suite for Events API endpoints."""

    @pytest.fixture
    def app(self, mock_db):
        """Create a Flask app with the events blueprint."""
        app = Flask(__name__)
        
        # Register the events blueprint
        events_bp = create_events_bp(mock_db)
        app.register_blueprint(events_bp, url_prefix='/api/events')
        
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
        """Create a mock database with pre-populated events data."""
        class MockDatabase(DatabaseInterface):
            def __init__(self):
                self.data = {
                    "events": [
                        {
                            "id": 1,
                            "title": "Litter A - Birth day",
                            "description": "Puppies born",
                            "start_date": datetime.datetime(2025, 1, 1),
                            "end_date": datetime.datetime(2025, 1, 1),
                            "all_day": True,
                            "event_type": "litter_milestone",
                            "related_type": "litter",
                            "related_id": 1,
                            "color": "#4CAF50",
                            "notify": True,
                            "notify_days_before": 1,
                            "recurring": "none",
                            "created_at": datetime.datetime(2024, 12, 1),
                            "updated_at": datetime.datetime(2024, 12, 1)
                        },
                        {
                            "id": 2,
                            "title": "Fido's Vet Appointment",
                            "description": "Annual checkup",
                            "start_date": datetime.datetime(2025, 2, 15, 10, 0),
                            "end_date": datetime.datetime(2025, 2, 15, 11, 0),
                            "all_day": False,
                            "event_type": "vet_appointment",
                            "related_type": "dog",
                            "related_id": 1,
                            "color": "#2196F3",
                            "notify": True,
                            "notify_days_before": 2,
                            "recurring": "none",
                            "created_at": datetime.datetime(2024, 12, 15),
                            "updated_at": datetime.datetime(2024, 12, 15)
                        },
                        {
                            "id": 3,
                            "title": "Fido's 3rd Birthday",
                            "description": "Fido turns 3 years old!",
                            "start_date": datetime.datetime(2025, 3, 10),
                            "end_date": datetime.datetime(2025, 3, 10),
                            "all_day": True,
                            "event_type": "birthday",
                            "related_type": "dog",
                            "related_id": 1,
                            "color": "#FF5722",
                            "notify": True,
                            "notify_days_before": 7,
                            "recurring": "yearly",
                            "created_at": datetime.datetime(2024, 12, 20),
                            "updated_at": datetime.datetime(2024, 12, 20)
                        }
                    ],
                    "event_rules": [
                        {
                            "id": 1,
                            "name": "Litter Birth Rule",
                            "description": "Create events when a litter is born",
                            "trigger_type": "litter_created",
                            "conditions": {},
                            "action_type": "create_event",
                            "action_data": {
                                "title": "New Litter Born",
                                "description": "A new litter has been born",
                                "event_type": "litter_milestone",
                                "days_delay": 0,
                                "all_day": True,
                                "notify": True
                            },
                            "active": True,
                            "created_at": datetime.datetime(2024, 12, 1),
                            "updated_at": datetime.datetime(2024, 12, 1)
                        }
                    ],
                    "dogs": [
                        {
                            "id": 1,
                            "call_name": "Fido",
                            "birth_date": datetime.datetime(2022, 3, 10),
                            "status": "Active"
                        }
                    ],
                    "litters": [
                        {
                            "id": 1,
                            "litter_name": "Litter A",
                            "whelp_date": datetime.datetime(2025, 1, 1),
                            "dam_id": 1
                        }
                    ]
                }
                self.next_id = {
                    "events": 4,
                    "event_rules": 2
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
            
            def find_with_query(self, table, query, params):
                """Find records with a custom query."""
                # Simplified implementation for testing
                if table not in self.data:
                    return []
                
                # For date range query
                if "start_date >= :start_date" in query and "end_date IS NULL OR end_date <= :end_date" in query:
                    start_date = params.get("start_date")
                    end_date = params.get("end_date")
                    
                    results = []
                    for item in self.data[table]:
                        if item.get("start_date") and item["start_date"] >= start_date:
                            if not item.get("end_date") or item["end_date"] <= end_date:
                                results.append(item.copy())
                    
                    return results
                
                return []
            
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
                
                # Add timestamps if not provided
                now = datetime.datetime.utcnow()
                if "created_at" not in data:
                    data["created_at"] = now
                if "updated_at" not in data:
                    data["updated_at"] = now
                
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
                        
                        # Update timestamp
                        self.data[table][i]["updated_at"] = datetime.datetime.utcnow()
                        
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

    def test_get_events(self, client):
        """Test getting all events."""
        response = client.get('/api/events/')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 3
        assert data[0]["title"] == "Litter A - Birth day"
        assert data[1]["title"] == "Fido's Vet Appointment"
        assert data[2]["title"] == "Fido's 3rd Birthday"

    def test_get_events_with_date_range(self, client):
        """Test getting events with date range filter."""
        # Test with date range that includes all events
        response = client.get('/api/events/?start_date=2025-01-01T00:00:00&end_date=2025-12-31T23:59:59')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 3
        
        # Test with date range that includes only one event
        response = client.get('/api/events/?start_date=2025-03-01T00:00:00&end_date=2025-03-31T23:59:59')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]["title"] == "Fido's 3rd Birthday"

    def test_get_event(self, client):
        """Test getting a specific event by ID."""
        # Test with valid ID
        response = client.get('/api/events/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data["id"] == 1
        assert data["title"] == "Litter A - Birth day"
        
        # Test with invalid ID
        response = client.get('/api/events/999')
        assert response.status_code == 404

    def test_create_event(self, client):
        """Test creating a new event."""
        event_data = {
            "title": "New Test Event",
            "description": "Test description",
            "start_date": "2025-04-15T09:00:00",
            "end_date": "2025-04-15T10:00:00",
            "all_day": False,
            "event_type": "test_event",
            "related_type": "dog",
            "related_id": 1,
            "color": "#9C27B0",
            "notify": True,
            "notify_days_before": 1,
            "recurring": "none"
        }
        
        response = client.post('/api/events/', json=event_data)
        assert response.status_code == 201
        
        data = json.loads(response.data)
        assert data["title"] == "New Test Event"
        assert data["id"] == 4  # Next ID in the sequence
        
        # Test with missing required field
        invalid_data = {
            "description": "Missing title",
            "start_date": "2025-04-15T09:00:00"
        }
        
        response = client.post('/api/events/', json=invalid_data)
        assert response.status_code == 400

    def test_update_event(self, client):
        """Test updating an existing event."""
        update_data = {
            "title": "Updated Event Title",
            "description": "Updated description"
        }
        
        # Test with valid ID
        response = client.put('/api/events/1', json=update_data)
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data["title"] == "Updated Event Title"
        assert data["description"] == "Updated description"
        
        # Test with invalid ID
        response = client.put('/api/events/999', json=update_data)
        assert response.status_code == 404

    def test_delete_event(self, client):
        """Test deleting an event."""
        # Test with valid ID
        response = client.delete('/api/events/1')
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get('/api/events/1')
        assert response.status_code == 404
        
        # Test with invalid ID
        response = client.delete('/api/events/999')
        assert response.status_code == 404

    def test_get_events_by_entity(self, client):
        """Test getting events for a specific entity."""
        # Test with valid entity
        response = client.get('/api/events/entity/dog/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]["title"] == "Fido's Vet Appointment"
        assert data[1]["title"] == "Fido's 3rd Birthday"
        
        # Test with invalid entity
        response = client.get('/api/events/entity/dog/999')
        assert response.status_code == 200
        assert len(json.loads(response.data)) == 0

    def test_get_events_by_type(self, client):
        """Test getting events of a specific type."""
        # Test with valid type
        response = client.get('/api/events/type/birthday')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]["title"] == "Fido's 3rd Birthday"
        
        # Test with invalid type
        response = client.get('/api/events/type/nonexistent_type')
        assert response.status_code == 200
        assert len(json.loads(response.data)) == 0

    def test_generate_litter_events(self, client):
        """Test generating events for a litter."""
        # Test with valid litter ID
        response = client.post('/api/events/generate/litter/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "message" in data
        assert "events" in data
        
        # Test with invalid litter ID
        response = client.post('/api/events/generate/litter/999')
        assert response.status_code == 404

    def test_event_rules_crud(self, client):
        """Test CRUD operations for event rules."""
        # Test getting all rules
        response = client.get('/api/events/rules')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]["name"] == "Litter Birth Rule"
        
        # Test getting a specific rule
        response = client.get('/api/events/rules/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data["id"] == 1
        assert data["name"] == "Litter Birth Rule"
        
        # Test creating a new rule
        rule_data = {
            "name": "Dog Birthday Rule",
            "description": "Create events for dog birthdays",
            "trigger_type": "dog_created",
            "action_type": "create_event",
            "action_data": {
                "title": "Birthday Event",
                "days_delay": 0,
                "event_type": "birthday"
            },
            "active": True
        }
        
        response = client.post('/api/events/rules', json=rule_data)
        assert response.status_code == 201
        
        data = json.loads(response.data)
        assert data["name"] == "Dog Birthday Rule"
        
        # Test updating a rule
        update_data = {
            "name": "Updated Rule Name",
            "active": False
        }
        
        response = client.put('/api/events/rules/1', json=update_data)
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data["name"] == "Updated Rule Name"
        assert data["active"] is False
        
        # Test deleting a rule
        response = client.delete('/api/events/rules/1')
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get('/api/events/rules/1')
        assert response.status_code == 404

    def test_process_rules_for_entity(self, client):
        """Test processing rules for an entity."""
        # Test with valid entity
        response = client.post('/api/events/rules/process/litter_created/litter/1')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "message" in data
        assert "results" in data
        
        # Test with invalid entity
        response = client.post('/api/events/rules/process/litter_created/litter/999')
        assert response.status_code == 404

    def test_generate_birthday_events(self, client):
        """Test generating birthday events for all dogs."""
        response = client.post('/api/events/generate/birthdays')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "message" in data
        assert "events" in data
