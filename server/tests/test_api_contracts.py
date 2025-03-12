"""
API contract tests for the Dog Breeding App.
These tests verify that the API response structure remains consistent to prevent breaking changes.
"""
import json
import pytest
from unittest.mock import patch, MagicMock

def test_dogs_api_contract(client, mock_db):
    """Test that the Dogs API maintains its contract."""
    # Setup: Create a test dog
    dog = mock_db.create("dogs", {
        "call_name": "Rover",
        "registered_name": "Rover's Full Name",
        "gender": "Male",
        "breed": "Labrador Retriever",
        "color": "Black",
        "birth_date": "2022-01-01"
    })
    
    # Test GET /api/dogs/
    response = client.get("/api/dogs/")
    assert response.status_code == 200
    dogs_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(dogs_list, list)
    if dogs_list:
        dog_obj = dogs_list[0]
        # Required fields that should always be present
        required_fields = ["id", "call_name", "registered_name", "gender", "breed", "color", "birth_date"]
        for field in required_fields:
            assert field in dog_obj
    
    # Test GET /api/dogs/:id
    response = client.get(f"/api/dogs/{dog['id']}")
    assert response.status_code == 200
    dog_obj = json.loads(response.data)
    
    # Verify the response structure
    required_fields = ["id", "call_name", "registered_name", "gender", "breed", "color", "birth_date"]
    for field in required_fields:
        assert field in dog_obj
    
    # Test POST /api/dogs/
    new_dog_data = {
        "call_name": "Buddy",
        "registered_name": "Buddy's Full Name",
        "gender": "Male",
        "breed": "Golden Retriever",
        "color": "Golden",
        "birth_date": "2023-01-01"
    }
    
    response = client.post(
        "/api/dogs/",
        data=json.dumps(new_dog_data),
        content_type="application/json"
    )
    assert response.status_code == 201
    new_dog = json.loads(response.data)
    
    # Verify the response structure
    for field in required_fields:
        if field != "id":  # id is added by the server
            assert new_dog[field] == new_dog_data[field]
    assert "id" in new_dog

def test_puppies_api_contract(client, mock_db):
    """Test that the Puppies API maintains its contract."""
    # Setup: Create a test litter and puppy
    litter = mock_db.create("litters", {
        "dam_id": 1,
        "sire_id": 2,
        "whelp_date": "2025-01-01",
        "litter_name": "Test Litter",
        "expected_size": 5
    })
    
    puppy = mock_db.create("puppies", {
        "litter_id": litter["id"],
        "name": "Puppy 1",
        "gender": "Male",
        "color": "Black",
        "birth_date": "2025-01-01",
        "status": "Available"
    })
    
    # Test GET /api/puppies/
    response = client.get("/api/puppies/")
    assert response.status_code == 200
    puppies_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(puppies_list, list)
    if puppies_list:
        puppy_obj = puppies_list[0]
        # Required fields that should always be present
        required_fields = ["id", "litter_id", "name", "gender", "color", "birth_date", "status"]
        for field in required_fields:
            assert field in puppy_obj
    
    # Test GET /api/puppies/:id
    response = client.get(f"/api/puppies/{puppy['id']}")
    assert response.status_code == 200
    puppy_obj = json.loads(response.data)
    
    # Verify the response structure
    required_fields = ["id", "litter_id", "name", "gender", "color", "birth_date", "status"]
    for field in required_fields:
        assert field in puppy_obj
    
    # Test GET /api/puppies/litter/:litter_id
    response = client.get(f"/api/puppies/litter/{litter['id']}")
    assert response.status_code == 200
    puppies_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(puppies_list, list)
    if puppies_list:
        puppy_obj = puppies_list[0]
        for field in required_fields:
            assert field in puppy_obj
        # Verify that all puppies have the correct litter_id
        for puppy in puppies_list:
            assert puppy["litter_id"] == litter["id"]

def test_litters_api_contract(client, mock_db):
    """Test that the Litters API maintains its contract."""
    # Setup: Create a test litter
    litter = mock_db.create("litters", {
        "dam_id": 1,
        "sire_id": 2,
        "whelp_date": "2025-01-01",
        "litter_name": "Test Litter",
        "expected_size": 5
    })
    
    # Test GET /api/litters/
    response = client.get("/api/litters/")
    assert response.status_code == 200
    litters_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(litters_list, list)
    if litters_list:
        litter_obj = litters_list[0]
        # Required fields that should always be present
        required_fields = ["id", "dam_id", "sire_id", "whelp_date", "litter_name", "expected_size"]
        for field in required_fields:
            assert field in litter_obj
    
    # Test GET /api/litters/:id
    response = client.get(f"/api/litters/{litter['id']}")
    assert response.status_code == 200
    litter_obj = json.loads(response.data)
    
    # Verify the response structure
    required_fields = ["id", "dam_id", "sire_id", "whelp_date", "litter_name", "expected_size"]
    for field in required_fields:
        assert field in litter_obj
    
    # Test GET /api/litters/:id/puppies
    # First add some puppies to the litter
    for i in range(2):
        mock_db.create("puppies", {
            "litter_id": litter["id"],
            "name": f"Puppy {i+1}",
            "gender": "Male" if i % 2 == 0 else "Female",
            "color": "Black",
            "birth_date": "2025-01-01",
            "status": "Available"
        })
    
    response = client.get(f"/api/litters/{litter['id']}/puppies")
    assert response.status_code == 200
    puppies_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(puppies_list, list)
    assert len(puppies_list) == 2
    for puppy in puppies_list:
        assert "id" in puppy
        assert "litter_id" in puppy
        assert puppy["litter_id"] == litter["id"]

def test_health_api_contract(client, mock_db):
    """Test that the Health API maintains its contract."""
    # Setup: Create a test dog and health record
    dog = mock_db.create("dogs", {
        "call_name": "Rover",
        "registered_name": "Rover's Full Name",
        "gender": "Male",
        "breed": "Labrador Retriever",
        "color": "Black",
        "birth_date": "2022-01-01"
    })
    
    health_record = mock_db.create("health_records", {
        "dog_id": dog["id"],
        "record_date": "2025-02-15",
        "record_type": "Examination",
        "notes": "Annual checkup",
        "veterinarian": "Dr. Smith"
    })
    
    # Test GET /api/health/records
    response = client.get("/api/health/records")
    assert response.status_code == 200
    records_list = json.loads(response.data)
    
    # Verify the response structure
    assert isinstance(records_list, list)
    if records_list:
        record_obj = records_list[0]
        # Required fields that should always be present
        required_fields = ["id", "dog_id", "record_date", "record_type", "notes"]
        for field in required_fields:
            assert field in record_obj
    
    # Test GET /api/health/records/:id
    response = client.get(f"/api/health/records/{health_record['id']}")
    assert response.status_code == 200
    record_obj = json.loads(response.data)
    
    # Verify the response structure
    required_fields = ["id", "dog_id", "record_date", "record_type", "notes"]
    for field in required_fields:
        assert field in record_obj
    
    # Test GET /api/health/dashboard
    response = client.get("/api/health/dashboard")
    assert response.status_code == 200
    dashboard = json.loads(response.data)
    
    # Verify the dashboard structure
    assert "upcoming_vaccinations" in dashboard
    assert "recent_health_records" in dashboard
    assert isinstance(dashboard["upcoming_vaccinations"], list)
    assert isinstance(dashboard["recent_health_records"], list)

def test_auth_api_contract(client, mock_db):
    """Test that the Auth API maintains its contract."""
    # Test POST /api/auth/signup
    signup_data = {
        "email": "test@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User"
    }
    
    response = client.post(
        "/api/auth/signup",
        data=json.dumps(signup_data),
        content_type="application/json"
    )
    assert response.status_code in (200, 201)
    result = json.loads(response.data)
    
    # Verify the response structure
    if "data" in result:
        user_data = result["data"]
        assert "id" in user_data
        assert "email" in user_data
        assert "first_name" in user_data
        assert "last_name" in user_data
        # Password should never be returned
        assert "password" not in user_data
    
    # Test POST /api/auth/login
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = client.post(
        "/api/auth/login",
        data=json.dumps(login_data),
        content_type="application/json"
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    
    # Verify the response structure
    assert "token" in result or ("data" in result and "token" in result["data"])

def test_applications_api_contract(client, mock_db):
    """Test that the Applications API maintains its contract."""
    # Setup: Create a test user/breeder
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test form
    form = mock_db.create("application_forms", {
        "name": "Puppy Application Form",
        "description": "Application for adopting a puppy",
        "is_active": True,
        "breeder_id": breeder["id"]
    })
    
    # Test GET /api/public/forms/:id
    response = client.get(f"/api/public/forms/{form['id']}")
    assert response.status_code == 200
    result = json.loads(response.data)
    
    # Verify the response structure
    assert "data" in result
    form_data = result["data"]
    assert "id" in form_data
    assert "name" in form_data
    assert "description" in form_data
    assert "questions" in form_data
    assert isinstance(form_data["questions"], list)
    
    # Test POST /api/public/forms/:id/submit
    submission_data = {
        "applicant_name": "John Doe",
        "applicant_email": "john@example.com",
        "applicant_phone": "123-456-7890",
        "responses": []
    }
    
    # Mock the EmailService to prevent actual email sending
    with patch('server.applications.EmailService.send_application_submitted_notification'):
        response = client.post(
            f"/api/public/forms/{form['id']}/submit",
            data=json.dumps(submission_data),
            content_type="application/json"
        )
    
    assert response.status_code in (200, 201)
    result = json.loads(response.data)
    
    # Verify the response structure
    assert "success" in result or "data" in result
    if "data" in result:
        submission = result["data"]
        assert "id" in submission
        assert "applicant_name" in submission
        assert "applicant_email" in submission
        assert "submission_date" in submission
