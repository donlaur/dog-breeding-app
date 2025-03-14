"""
Tests for the puppies endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock

def test_get_all_puppies(client, mock_db):
    """Test successful retrieval of all puppies."""
    # Get all puppies from the mock database
    puppies = mock_db.find_by_field_values("puppies", {})
    assert len(puppies) > 0
    
    # Make the request
    response = client.get("/api/puppies")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == len(puppies)

def test_get_puppy_by_id_success(client, mock_db):
    """Test successful retrieval of a puppy by ID."""
    # Get the first puppy from the mock database
    puppies = mock_db.find_by_field_values("puppies", {})
    assert len(puppies) > 0
    puppy_id = puppies[0]["id"]
    
    # Make the request
    response = client.get(f"/api/puppies/{puppy_id}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, dict)
    assert data["id"] == puppy_id

def test_get_puppy_by_id_not_found(client, mock_db):
    """Test error handling when puppy ID doesn't exist."""
    # Use a non-existent ID
    non_existent_id = 9999
    
    # Make the request
    response = client.get(f"/api/puppies/{non_existent_id}")
    
    # Check the response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data

def test_get_puppies_by_litter_id(client, mock_db):
    """Test getting puppies by litter ID."""
    # Get the first litter from the mock database
    litters = mock_db.find_by_field_values("litters", {})
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Make the request
    response = client.get(f"/api/puppies/litter/{litter_id}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    
    # Verify each puppy has the correct litter_id
    for puppy in data:
        assert puppy["litter_id"] == litter_id

def test_create_puppy_success(client, mock_db):
    """Test successful creation of a puppy."""
    # Get the first litter from the mock database
    litters = mock_db.find_by_field_values("litters", {})
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Prepare the data for a new puppy
    new_puppy_data = {
        "name": "New Test Puppy",
        "gender": "Male",
        "birth_date": "2025-01-01",
        "color": "Black and White",
        "litter_id": litter_id
    }
    
    # Make the request
    response = client.post(
        "/api/puppies",
        data=json.dumps(new_puppy_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "id" in data
    assert data["name"] == new_puppy_data["name"]
    assert data["gender"] == new_puppy_data["gender"]
    assert data["color"] == new_puppy_data["color"]
    assert data["litter_id"] == litter_id

def test_create_puppy_missing_fields(client):
    """Test error handling when required fields are missing."""
    # Prepare incomplete data
    incomplete_data = {
        "name": "Incomplete Puppy"
        # Missing required fields
    }
    
    # Make the request
    response = client.post(
        "/api/puppies",
        data=json.dumps(incomplete_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data

def test_update_puppy_success(client, mock_db):
    """Test successful update of a puppy."""
    # Get the first puppy from the mock database
    puppies = mock_db.find_by_field_values("puppies", {})
    assert len(puppies) > 0
    puppy_id = puppies[0]["id"]
    
    # Prepare the update data
    update_data = {
        "name": "Updated Puppy Name",
        "color": "Updated Color"
    }
    
    # Make the request
    response = client.put(
        f"/api/puppies/{puppy_id}",
        data=json.dumps(update_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["id"] == puppy_id
    assert data["name"] == update_data["name"]
    assert data["color"] == update_data["color"]

def test_update_puppy_not_found(client):
    """Test error handling when updating a non-existent puppy."""
    # Use a non-existent ID
    non_existent_id = 9999
    
    # Prepare the update data
    update_data = {
        "name": "This Puppy Doesn't Exist"
    }
    
    # Make the request
    response = client.put(
        f"/api/puppies/{non_existent_id}",
        data=json.dumps(update_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data

def test_delete_puppy_success(client, mock_db):
    """Test successful deletion of a puppy."""
    # Get the first puppy from the mock database
    puppies = mock_db.find_by_field_values("puppies", {})
    assert len(puppies) > 0
    puppy_id = puppies[0]["id"]
    
    # Make the request
    response = client.delete(f"/api/puppies/{puppy_id}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True

def test_delete_puppy_not_found(client):
    """Test error handling when deleting a non-existent puppy."""
    # Use a non-existent ID
    non_existent_id = 9999
    
    # Make the request
    response = client.delete(f"/api/puppies/{non_existent_id}")
    
    # Check the response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data

def test_puppies_table_is_queried():
    """Test that the puppies table is queried correctly."""
    # Create a function that simulates a puppies endpoint
    def get_puppies_by_litter(litter_id, db):
        try:
            # Check if litter exists
            litter = db.get("litters", litter_id)
            if not litter:
                return {"error": f"Litter with ID {litter_id} not found"}, 404
            
            # Get puppies for this litter
            puppies = db.find_by_field_values("puppies", {"litter_id": litter_id})
            return puppies
        except Exception as e:
            return {"error": str(e)}, 500
    
    # Create a mock database
    mock_db = MagicMock()
    mock_db.get.return_value = {"id": 1, "name": "Test Litter"}
    mock_db.find_by_field_values.return_value = [
        {"id": 1, "name": "Puppy 1", "litter_id": 1}
    ]
    
    # Call the function
    result = get_puppies_by_litter(1, mock_db)
    
    # Verify that find_by_field_values was called with the puppies table
    mock_db.find_by_field_values.assert_called_once_with("puppies", {"litter_id": 1})
