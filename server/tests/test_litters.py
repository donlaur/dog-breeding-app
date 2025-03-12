"""
Tests for the litters endpoints.
"""
import json
import pytest
from unittest.mock import patch

def test_get_litter_puppies_success(client, mock_db):
    """Test successful retrieval of puppies for a litter."""
    # Get the first litter from the mock database
    litters = mock_db.find("litters")
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Make the request
    response = client.get(f"/api/litters/{litter_id}/puppies")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 3  # We created 3 puppies in the fixture
    
    # Verify each puppy has the correct litter_id
    for puppy in data:
        assert puppy["litter_id"] == litter_id

def test_get_litter_puppies_nonexistent_litter(client):
    """Test retrieving puppies for a nonexistent litter."""
    # Use a litter ID that doesn't exist
    litter_id = 9999
    
    # Make the request
    response = client.get(f"/api/litters/{litter_id}/puppies")
    
    # Check the response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data
    assert f"Litter with ID {litter_id} not found" in data["error"]

def test_get_litter_puppies_empty_result(client, mock_db):
    """Test retrieving puppies for a litter with no puppies."""
    # Create a new litter with no puppies
    dam = mock_db.create("dogs", {"call_name": "EmptyDam", "gender": "Female"})
    sire = mock_db.create("dogs", {"call_name": "EmptySire", "gender": "Male"})
    empty_litter = mock_db.create("litters", {
        "dam_id": dam["id"],
        "sire_id": sire["id"],
        "whelp_date": "2025-02-01",
        "litter_name": "Empty Litter"
    })
    
    # Make the request
    response = client.get(f"/api/litters/{empty_litter['id']}/puppies")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0  # No puppies for this litter

def test_get_litter_puppies_correct_table_queried(client, mock_db):
    """Test that the endpoint queries the puppies table, not the dogs table."""
    # Get the first litter from the mock database
    litters = mock_db.find("litters")
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Create a spy on the find_by_field_values method
    original_method = mock_db.find_by_field_values
    call_args = []
    
    def spy_find_by_field_values(table, filters):
        call_args.append((table, filters))
        return original_method(table, filters)
    
    mock_db.find_by_field_values = spy_find_by_field_values
    
    # Make the request
    response = client.get(f"/api/litters/{litter_id}/puppies")
    
    # Check that the correct table was queried
    assert len(call_args) > 0
    table, filters = call_args[0]
    assert table == "puppies"  # Must query the puppies table
    assert "litter_id" in filters
    assert filters["litter_id"] == litter_id

def test_get_litter_with_dam_sire_names(client, mock_db):
    """Test that the get_litter endpoint includes dam and sire names."""
    # Get the first litter from the mock database
    litters = mock_db.find("litters")
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Make the request
    response = client.get(f"/api/litters/{litter_id}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Verify dam and sire names are included
    assert "dam_name" in data
    assert "sire_name" in data
    assert data["dam_name"] == "TestDam"
    assert data["sire_name"] == "TestSire"

def test_database_error_handling(client, mock_db):
    """Test error handling when the database raises an exception."""
    # Get the first litter from the mock database
    litters = mock_db.find("litters")
    assert len(litters) > 0
    litter_id = litters[0]["id"]
    
    # Make the find_by_field_values method raise an exception
    def raise_exception(*args, **kwargs):
        raise Exception("Test database error")
    
    original_method = mock_db.find_by_field_values
    mock_db.find_by_field_values = raise_exception
    
    # Make the request
    response = client.get(f"/api/litters/{litter_id}/puppies")
    
    # Check the response
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "Test database error" in data["error"]
    
    # Restore the original method
    mock_db.find_by_field_values = original_method
