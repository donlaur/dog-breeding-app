"""
Tests for the applications endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_get_application_forms(client, mock_db):
    """Test successful retrieval of application forms for a breeder."""
    # Ensure the application_forms table exists
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    
    # Create a test user/breeder
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create test application forms for this breeder
    form1 = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Puppy Application Form",
        "description": "Application for adopting a puppy",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    form2 = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Adult Dog Application Form",
        "description": "Application for adopting an adult dog",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.get("/api/application-forms")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 2
    
    # Verify the forms are returned with the correct data
    form_names = [form["name"] for form in data["data"]]
    assert "Puppy Application Form" in form_names
    assert "Adult Dog Application Form" in form_names

def test_get_application_form_by_id(client, mock_db):
    """Test successful retrieval of a specific application form with its questions."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["form_questions"] = {}
    mock_db.next_id["form_questions"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Puppy Application Form",
        "description": "Application for adopting a puppy",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Create test questions for this form
    question1 = mock_db.create("form_questions", {
        "form_id": form["id"],
        "question_text": "Why do you want to adopt a puppy?",
        "description": "Please explain your reasons",
        "question_type": "text",
        "is_required": True,
        "order_position": 1,
        "options": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    question2 = mock_db.create("form_questions", {
        "form_id": form["id"],
        "question_text": "Do you have other pets?",
        "description": "Tell us about your current pets",
        "question_type": "radio",
        "is_required": True,
        "order_position": 2,
        "options": json.dumps(["Yes", "No"]),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.get(f"/api/application-forms/{form['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert "form" in data["data"]
    assert "questions" in data["data"]
    
    # Verify the form data
    assert data["data"]["form"]["id"] == form["id"]
    assert data["data"]["form"]["name"] == form["name"]
    
    # Verify the questions
    assert len(data["data"]["questions"]) == 2
    question_texts = [q["question_text"] for q in data["data"]["questions"]]
    assert "Why do you want to adopt a puppy?" in question_texts
    assert "Do you have other pets?" in question_texts

def test_create_application_form(client, mock_db):
    """Test successful creation of an application form."""
    # Ensure the application_forms table exists
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Prepare the data for a new form
    new_form_data = {
        "name": "New Application Form",
        "description": "A new application form for testing",
        "is_active": True
    }
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.post(
            "/api/application-forms",
            data=json.dumps(new_form_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["name"] == new_form_data["name"]
    assert data["data"]["description"] == new_form_data["description"]
    assert data["data"]["breeder_id"] == breeder["id"]

def test_update_application_form(client, mock_db):
    """Test successful update of an application form."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Original Form Name",
        "description": "Original description",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Prepare the update data
    update_data = {
        "name": "Updated Form Name",
        "description": "Updated description",
        "is_active": False
    }
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.put(
            f"/api/application-forms/{form['id']}",
            data=json.dumps(update_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["id"] == form["id"]
    assert data["data"]["name"] == update_data["name"]
    assert data["data"]["description"] == update_data["description"]
    assert data["data"]["is_active"] == update_data["is_active"]

def test_delete_application_form(client, mock_db):
    """Test successful deletion of an application form."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Form to Delete",
        "description": "This form will be deleted",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.delete(f"/api/application-forms/{form['id']}")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "message" in data
    assert "deleted" in data["message"].lower()

def test_create_form_question(client, mock_db):
    """Test successful creation of a form question."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["form_questions"] = {}
    mock_db.next_id["form_questions"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Test Form",
        "description": "A test form",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Prepare the data for a new question
    new_question_data = {
        "form_id": form["id"],
        "question_text": "What is your experience with dogs?",
        "description": "Please describe your experience",
        "question_type": "textarea",
        "is_required": True,
        "order_position": 1,
        "options": None
    }
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.post(
            "/api/form-questions",
            data=json.dumps(new_question_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["question_text"] == new_question_data["question_text"]
    assert data["data"]["question_type"] == new_question_data["question_type"]
    assert data["data"]["form_id"] == form["id"]

def test_public_form_submission(client, mock_db):
    """Test successful submission of a public application form."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["form_questions"] = {}
    mock_db.next_id["form_questions"] = 1
    mock_db.tables["form_submissions"] = {}
    mock_db.next_id["form_submissions"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Public Test Form",
        "description": "A public test form",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Create test questions for this form
    question1 = mock_db.create("form_questions", {
        "form_id": form["id"],
        "question_text": "Why do you want to adopt?",
        "description": "Please explain",
        "question_type": "text",
        "is_required": True,
        "order_position": 1,
        "options": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Prepare the submission data
    submission_data = {
        "applicant_name": "John Doe",
        "applicant_email": "john@example.com",
        "applicant_phone": "123-456-7890",
        "responses": [
            {
                "question_id": question1["id"],
                "answer": "I've always wanted a dog and now I have the space and time."
            }
        ]
    }
    
    # Mock the EmailService to prevent actual email sending
    with patch('server.applications.EmailService.send_application_submitted_notification'):
        # Make the request
        response = client.post(
            f"/api/public/forms/{form['id']}/submit",
            data=json.dumps(submission_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert "id" in data["data"]
    assert "message" in data["data"]
    assert "submitted successfully" in data["data"]["message"]

def test_get_form_submissions(client, mock_db):
    """Test successful retrieval of form submissions for a breeder."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["form_submissions"] = {}
    mock_db.next_id["form_submissions"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Test Form",
        "description": "A test form",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Create test submissions for this form
    submission1 = mock_db.create("form_submissions", {
        "form_id": form["id"],
        "applicant_name": "John Doe",
        "applicant_email": "john@example.com",
        "status": "pending",
        "responses": [{"question_id": 1, "answer": "Test answer"}],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    submission2 = mock_db.create("form_submissions", {
        "form_id": form["id"],
        "applicant_name": "Jane Smith",
        "applicant_email": "jane@example.com",
        "status": "approved",
        "responses": [{"question_id": 1, "answer": "Another test answer"}],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        # Make the request
        response = client.get("/api/form-submissions")
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 2
    
    # Verify the submissions are returned with the correct data
    applicant_names = [sub["applicant_name"] for sub in data["data"]]
    assert "John Doe" in applicant_names
    assert "Jane Smith" in applicant_names

def test_update_submission_status(client, mock_db):
    """Test successful update of a submission status."""
    # Ensure the necessary tables exist
    mock_db.tables["application_forms"] = {}
    mock_db.next_id["application_forms"] = 1
    mock_db.tables["form_submissions"] = {}
    mock_db.next_id["form_submissions"] = 1
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a test user/breeder
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # Create a test application form
    form = mock_db.create("application_forms", {
        "breeder_id": breeder["id"],
        "name": "Test Form",
        "description": "A test form",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Create a test submission
    submission = mock_db.create("form_submissions", {
        "form_id": form["id"],
        "applicant_name": "John Doe",
        "applicant_email": "john@example.com",
        "status": "pending",
        "responses": [{"question_id": 1, "answer": "Test answer"}],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Prepare the status update data
    update_data = {
        "status": "approved"
    }
    
    # Mock the token verification and email service
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)), \
         patch('server.applications.EmailService.send_application_status_update'):
        # Make the request
        response = client.put(
            f"/api/form-submissions/{submission['id']}/status",
            data=json.dumps(update_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["id"] == submission["id"]
    assert data["data"]["status"] == update_data["status"]
