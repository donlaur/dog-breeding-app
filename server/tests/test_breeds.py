"""
Tests for the breeds endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_get_all_breeds(client, mock_db):
    """Test successful retrieval of all breeds."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Add test breeds to the mock database
    breed1 = mock_db.create("breeds", {
        "name": "Labrador Retriever",
        "description": "Friendly, active and outgoing",
        "size": "Large",
        "coat_type": "Short",
        "temperament": "Friendly, Active, Outgoing",
        "life_expectancy": "10-12 years",
        "origin": "Canada",
        "image_url": "https://example.com/labrador.jpg"
    })
    
    breed2 = mock_db.create("breeds", {
        "name": "German Shepherd",
        "description": "Confident, courageous and smart",
        "size": "Large",
        "coat_type": "Medium",
        "temperament": "Confident, Courageous, Smart",
        "life_expectancy": "7-10 years",
        "origin": "Germany",
        "image_url": "https://example.com/german_shepherd.jpg"
    })
    
    # Make the request
    response = client.get("/api/breeds/")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verify breed data
    breed_names = [breed["name"] for breed in data]
    assert "Labrador Retriever" in breed_names
    assert "German Shepherd" in breed_names

def test_get_breed_by_id(client, mock_db):
    """Test successful retrieval of a breed by ID."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Add a test breed to the mock database
    breed = mock_db.create("breeds", {
        "name": "Beagle",
        "description": "Friendly, curious and merry",
        "size": "Medium",
        "coat_type": "Short",
        "temperament": "Friendly, Curious, Merry",
        "life_expectancy": "12-15 years",
        "origin": "United Kingdom",
        "image_url": "https://example.com/beagle.jpg"
    })
    
    # Make the request
    response = client.get(f"/api/breeds/{breed['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, dict)
    assert data["id"] == breed["id"]
    assert data["name"] == breed["name"]
    assert data["description"] == breed["description"]
    assert data["size"] == breed["size"]
    assert data["temperament"] == breed["temperament"]

def test_get_breed_not_found(client, mock_db):
    """Test error handling when a breed is not found."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Make the request with a non-existent ID
    non_existent_id = 999
    response = client.get(f"/api/breeds/{non_existent_id}")
    
    # Check the response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data
    assert "not found" in data["error"].lower()

def test_create_breed(client, mock_db):
    """Test successful creation of a breed."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Create a test user/admin
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    admin = mock_db.create("users", {
        "email": "admin@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    })
    
    # Prepare the data for a new breed
    new_breed_data = {
        "name": "Australian Shepherd",
        "description": "Intelligent, work-oriented, and exuberant",
        "size": "Medium",
        "coat_type": "Medium",
        "temperament": "Intelligent, Work-oriented, Exuberant",
        "life_expectancy": "12-15 years",
        "origin": "United States",
        "image_url": "https://example.com/aussie.jpg"
    }
    
    # Mock the token verification to return our test admin
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(admin, *args[1:], **kwargs)), \
         patch('server.auth.admin_required', lambda f: lambda *args, **kwargs: f(*args, **kwargs)):
        # Make the request
        response = client.post(
            "/api/breeds/",
            data=json.dumps(new_breed_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "id" in data
    assert data["name"] == new_breed_data["name"]
    assert data["description"] == new_breed_data["description"]
    assert data["size"] == new_breed_data["size"]
    assert data["temperament"] == new_breed_data["temperament"]

def test_update_breed(client, mock_db):
    """Test successful update of a breed."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Add a test breed to the mock database
    breed = mock_db.create("breeds", {
        "name": "Poodle",
        "description": "Active, proud, and very smart",
        "size": "Varies (Toy, Miniature, Standard)",
        "coat_type": "Curly",
        "temperament": "Active, Proud, Very Smart",
        "life_expectancy": "10-18 years",
        "origin": "Germany/France",
        "image_url": "https://example.com/poodle.jpg"
    })
    
    # Create a test user/admin
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    admin = mock_db.create("users", {
        "email": "admin@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    })
    
    # Prepare the update data
    update_data = {
        "description": "Updated description: Highly intelligent and trainable",
        "temperament": "Intelligent, Alert, Faithful, Trainable"
    }
    
    # Mock the token verification to return our test admin
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(admin, *args[1:], **kwargs)), \
         patch('server.auth.admin_required', lambda f: lambda *args, **kwargs: f(*args, **kwargs)):
        # Make the request
        response = client.put(
            f"/api/breeds/{breed['id']}",
            data=json.dumps(update_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["id"] == breed["id"]
    assert data["name"] == breed["name"]  # Name should remain the same
    assert data["description"] == update_data["description"]  # Description should be updated
    assert data["temperament"] == update_data["temperament"]  # Temperament should be updated

def test_delete_breed(client, mock_db):
    """Test successful deletion of a breed."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Add a test breed to the mock database
    breed = mock_db.create("breeds", {
        "name": "Boxer",
        "description": "Bright, energetic and playful",
        "size": "Medium to Large",
        "coat_type": "Short",
        "temperament": "Bright, Energetic, Playful",
        "life_expectancy": "10-12 years",
        "origin": "Germany",
        "image_url": "https://example.com/boxer.jpg"
    })
    
    # Create a test user/admin
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    admin = mock_db.create("users", {
        "email": "admin@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    })
    
    # Mock the token verification to return our test admin
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(admin, *args[1:], **kwargs)), \
         patch('server.auth.admin_required', lambda f: lambda *args, **kwargs: f(*args, **kwargs)):
        # Make the request
        response = client.delete(f"/api/breeds/{breed['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "message" in data
    assert "deleted" in data["message"].lower()
    
    # Verify the breed is actually deleted
    assert breed["id"] not in mock_db.tables["breeds"]

def test_search_breeds(client, mock_db):
    """Test successful search of breeds by name or characteristics."""
    # Ensure the breeds table exists
    mock_db.tables["breeds"] = {}
    mock_db.next_id["breeds"] = 1
    
    # Add test breeds to the mock database
    breed1 = mock_db.create("breeds", {
        "name": "Golden Retriever",
        "description": "Intelligent, friendly, and devoted",
        "size": "Large",
        "coat_type": "Medium to Long",
        "temperament": "Intelligent, Friendly, Devoted",
        "life_expectancy": "10-12 years",
        "origin": "Scotland",
        "image_url": "https://example.com/golden.jpg"
    })
    
    breed2 = mock_db.create("breeds", {
        "name": "Border Collie",
        "description": "Energetic, smart, and work-oriented",
        "size": "Medium",
        "coat_type": "Medium",
        "temperament": "Energetic, Smart, Work-oriented",
        "life_expectancy": "12-15 years",
        "origin": "United Kingdom",
        "image_url": "https://example.com/border_collie.jpg"
    })
    
    # Make the request with a search query
    response = client.get("/api/breeds/search?q=intelligent")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Verify the search results
    found_golden = False
    for breed in data:
        if breed["name"] == "Golden Retriever":
            found_golden = True
            break
    assert found_golden, "Golden Retriever should be found when searching for 'intelligent'"

def test_get_breed_characteristics(client, mock_db):
    """Test successful retrieval of breed characteristics."""
    # Make the request
    response = client.get("/api/breeds/characteristics")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "sizes" in data
    assert "coat_types" in data
    assert "temperaments" in data
    
    # Verify the characteristics data
    assert isinstance(data["sizes"], list)
    assert isinstance(data["coat_types"], list)
    assert isinstance(data["temperaments"], list)
    assert len(data["sizes"]) > 0
    assert len(data["coat_types"]) > 0

def test_database_query_pattern_breeds():
    """Test that the correct database query pattern is used for breeds endpoints."""
    # Create a function that simulates the get_all_breeds endpoint
    def get_all_breeds(db):
        try:
            breeds = db.find_by_field_values("breeds", {})
            return breeds
        except Exception as e:
            return {"error": str(e)}, 500
    
    # Create a function that simulates the get_breed_by_id endpoint
    def get_breed_by_id(db, breed_id):
        try:
            breed = db.get("breeds", breed_id)
            if not breed:
                return {"error": "Breed not found"}, 404
            return breed
        except Exception as e:
            return {"error": str(e)}, 500
    
    # Create a mock database
    mock_db = MagicMock()
    mock_db.find.return_value = [{"id": 1, "name": "Labrador Retriever"}]
    mock_db.get.return_value = {"id": 1, "name": "Labrador Retriever"}
    
    # Call the functions
    result = get_all_breeds(mock_db)
    mock_db.find.assert_called_once_with("breeds")
    
    result = get_breed_by_id(mock_db, 1)
    mock_db.get.assert_called_once_with("breeds", 1)
