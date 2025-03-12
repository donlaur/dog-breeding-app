"""
Tests for the health endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_get_health_records(client, mock_db):
    """Test successful retrieval of health records."""
    # Add a test health record to the mock database
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    
    test_record = mock_db.create("health_records", {
        "dog_id": 1,
        "record_date": "2025-01-01",
        "record_type": "Examination",
        "notes": "Regular checkup",
        "veterinarian": "Dr. Smith"
    })
    
    # Make the request
    response = client.get("/api/health/records")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_record["id"]

def test_get_health_record_by_id(client, mock_db):
    """Test successful retrieval of a health record by ID."""
    # Add a test health record to the mock database
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    
    test_record = mock_db.create("health_records", {
        "dog_id": 1,
        "record_date": "2025-01-01",
        "record_type": "Examination",
        "notes": "Regular checkup",
        "veterinarian": "Dr. Smith"
    })
    
    # Make the request
    response = client.get(f"/api/health/records/{test_record['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, dict)
    assert data["id"] == test_record["id"]
    assert data["dog_id"] == test_record["dog_id"]
    assert data["record_type"] == test_record["record_type"]

def test_create_health_record(client, mock_db):
    """Test successful creation of a health record."""
    # Ensure the health_records table exists
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    
    # Get a dog ID
dogs = mock_db.find_by_field_values("dogs")
    assert len(dogs) > 0
    dog_id = dogs[0]["id"]
    
    # Prepare the data for a new health record
    new_record_data = {
        "dog_id": dog_id,
        "record_date": "2025-01-15",
        "record_type": "Vaccination",
        "notes": "Annual vaccines",
        "veterinarian": "Dr. Johnson"
    }
    
    # Make the request
    response = client.post(
        "/api/health/records",
        data=json.dumps(new_record_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "id" in data
    assert data["dog_id"] == new_record_data["dog_id"]
    assert data["record_type"] == new_record_data["record_type"]
    assert data["notes"] == new_record_data["notes"]

def test_update_health_record(client, mock_db):
    """Test successful update of a health record."""
    # Add a test health record to the mock database
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    
    test_record = mock_db.create("health_records", {
        "dog_id": 1,
        "record_date": "2025-01-01",
        "record_type": "Examination",
        "notes": "Regular checkup",
        "veterinarian": "Dr. Smith"
    })
    
    # Prepare the update data
    update_data = {
        "notes": "Updated notes",
        "veterinarian": "Dr. Brown"
    }
    
    # Make the request
    response = client.put(
        f"/api/health/records/{test_record['id']}",
        data=json.dumps(update_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["id"] == test_record["id"]
    assert data["notes"] == update_data["notes"]
    assert data["veterinarian"] == update_data["veterinarian"]
    assert data["record_type"] == test_record["record_type"]  # Unchanged field

def test_delete_health_record(client, mock_db):
    """Test successful deletion of a health record."""
    # Add a test health record to the mock database
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    
    test_record = mock_db.create("health_records", {
        "dog_id": 1,
        "record_date": "2025-01-01",
        "record_type": "Examination",
        "notes": "Regular checkup",
        "veterinarian": "Dr. Smith"
    })
    
    # Make the request
    response = client.delete(f"/api/health/records/{test_record['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True

def test_get_vaccinations(client, mock_db):
    """Test successful retrieval of vaccinations."""
    # Add a test vaccination to the mock database
    mock_db.tables["vaccinations"] = {}
    mock_db.next_id["vaccinations"] = 1
    
    test_vaccination = mock_db.create("vaccinations", {
        "dog_id": 1,
        "vaccination_date": "2025-01-01",
        "vaccine_type": "Rabies",
        "next_due_date": "2026-01-01",
        "administered_by": "Dr. Smith"
    })
    
    # Make the request
    response = client.get("/api/health/vaccinations")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_vaccination["id"]

def test_create_vaccination(client, mock_db):
    """Test successful creation of a vaccination."""
    # Ensure the vaccinations table exists
    mock_db.tables["vaccinations"] = {}
    mock_db.next_id["vaccinations"] = 1
    
    # Get a dog ID
dogs = mock_db.find_by_field_values("dogs")
    assert len(dogs) > 0
    dog_id = dogs[0]["id"]
    
    # Prepare the data for a new vaccination
    new_vaccination_data = {
        "dog_id": dog_id,
        "vaccination_date": "2025-02-15",
        "vaccine_type": "Distemper",
        "next_due_date": "2026-02-15",
        "administered_by": "Dr. Johnson"
    }
    
    # Make the request
    response = client.post(
        "/api/health/vaccinations",
        data=json.dumps(new_vaccination_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "id" in data
    assert data["dog_id"] == new_vaccination_data["dog_id"]
    assert data["vaccine_type"] == new_vaccination_data["vaccine_type"]

def test_get_weight_records(client, mock_db):
    """Test successful retrieval of weight records."""
    # Add a test weight record to the mock database
    mock_db.tables["weight_records"] = {}
    mock_db.next_id["weight_records"] = 1
    
    test_weight = mock_db.create("weight_records", {
        "dog_id": 1,
        "weight_date": "2025-01-01",
        "weight": 25.5,
        "notes": "Healthy weight"
    })
    
    # Make the request
    response = client.get("/api/health/weights")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_weight["id"]

def test_health_dashboard(client, mock_db):
    """Test retrieval of health dashboard data."""
    # Add test data to the mock database
    mock_db.tables["health_records"] = {}
    mock_db.next_id["health_records"] = 1
    mock_db.tables["vaccinations"] = {}
    mock_db.next_id["vaccinations"] = 1
    mock_db.tables["weight_records"] = {}
    mock_db.next_id["weight_records"] = 1
    
    # Add a health record
    mock_db.create("health_records", {
        "dog_id": 1,
        "record_date": "2025-01-01",
        "record_type": "Examination",
        "notes": "Regular checkup"
    })
    
    # Add a vaccination
    mock_db.create("vaccinations", {
        "dog_id": 1,
        "vaccination_date": "2025-01-01",
        "vaccine_type": "Rabies",
        "next_due_date": "2026-01-01"
    })
    
    # Make the request
    response = client.get("/api/health/dashboard")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "upcoming_vaccinations" in data
    assert "recent_health_records" in data

def test_database_query_pattern_health():
    """Test that the correct database query pattern is used for health endpoints."""
    # Create a function that simulates the get_health_records endpoint
    def get_health_records(db, filters=None):
        try:
            if filters:
                records = db.find_by_field_values("health_records", filters)
            else:
records = db.find_by_field_values("health_records")
            return records
        except Exception as e:
            return {"error": str(e)}, 500
    
    # Create a mock database
    mock_db = MagicMock()
    mock_db.find.return_value = [{"id": 1, "dog_id": 1, "record_type": "Examination"}]
    mock_db.find_by_field_values.return_value = [{"id": 1, "dog_id": 1, "record_type": "Examination"}]
    
    # Call the function without filters
    result = get_health_records(mock_db)
    mock_db.find.assert_called_once_with("health_records")
    
    # Call the function with filters
    filters = {"dog_id": 1}
    result = get_health_records(mock_db, filters)
    mock_db.find_by_field_values.assert_called_once_with("health_records", filters)
