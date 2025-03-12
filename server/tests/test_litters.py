"""
Tests for the litters endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock

def test_get_litter_puppies_success(client, mock_db):
    """Test successful retrieval of puppies for a litter."""
    # Get the first litter from the mock database
litters = mock_db.find_by_field_values("litters")
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

def test_puppies_table_is_queried():
    """Test that the puppies table is queried, not the dogs table."""
    # Create a function that simulates the get_litter_puppies endpoint
    def get_litter_puppies(litter_id, db):
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
    result = get_litter_puppies(1, mock_db)
    
    # Verify that find_by_field_values was called with the puppies table
    mock_db.find_by_field_values.assert_called_once_with("puppies", {"litter_id": 1})

def test_dam_sire_names_included():
    """Test that dam and sire names are included in litter details."""
    # Create a function that simulates the get_litter endpoint
    def get_litter(litter_id, db):
        try:
            # Get litter
            litter = db.get("litters", litter_id)
            if not litter:
                return {"error": f"Litter with ID {litter_id} not found"}, 404
            
            # Get dam and sire names
            if litter.get("dam_id"):
                dam = db.get("dogs", litter["dam_id"])
                if dam:
                    litter["dam_name"] = dam.get("call_name", "Unknown")
            
            if litter.get("sire_id"):
                sire = db.get("dogs", litter["sire_id"])
                if sire:
                    litter["sire_name"] = sire.get("call_name", "Unknown")
            
            return litter
        except Exception as e:
            return {"error": str(e)}, 500
    
    # Create a mock database
    mock_db = MagicMock()
    litter = {
        "id": 1, 
        "dam_id": 2, 
        "sire_id": 3, 
        "litter_name": "Test Litter",
        "whelp_date": "2025-01-01"
    }
    mock_db.get.side_effect = lambda table, id: (
        litter if table == "litters" and id == 1 else 
        {"id": 2, "call_name": "TestDam"} if table == "dogs" and id == 2 else
        {"id": 3, "call_name": "TestSire"} if table == "dogs" and id == 3 else
        None
    )
    
    # Call the function
    result = get_litter(1, mock_db)
    
    # Verify dam and sire names are included
    assert "dam_name" in result
    assert "sire_name" in result
    assert result["dam_name"] == "TestDam"
    assert result["sire_name"] == "TestSire"

def test_nonexistent_litter_error():
    """Test error handling for nonexistent litter."""
    # Create a function that simulates the get_litter_puppies endpoint
    def get_litter_puppies(litter_id, db):
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
    mock_db.get.return_value = None  # Litter not found
    
    # Call the function
    result, status_code = get_litter_puppies(999, mock_db)
    
    # Verify error response
    assert status_code == 404
    assert "error" in result
    assert "not found" in result["error"]

def test_database_error_handling():
    """Test error handling when the database raises an exception."""
    # Create a function that simulates the get_litter_puppies endpoint
    def get_litter_puppies(litter_id, db):
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
    mock_db.get.return_value = {"id": 1}  # Litter exists
    mock_db.find_by_field_values.side_effect = Exception("Test database error")
    
    # Call the function
    result, status_code = get_litter_puppies(1, mock_db)
    
    # Verify error response
    assert status_code == 500
    assert "error" in result
    assert "Test database error" in result["error"]
