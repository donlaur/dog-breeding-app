"""
Integration tests for critical workflows in the Dog Breeding App.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_complete_litter_workflow(client, mock_db):
    """Test the complete workflow of creating a litter and adding puppies."""
    # 1. Create dam and sire dogs first
    dam_data = {
        "call_name": "Daisy",
        "registered_name": "Daisy's Full Name",
        "gender": "Female",
        "breed": "Labrador Retriever",
        "color": "Yellow",
        "birth_date": "2020-01-15"
    }
    
    sire_data = {
        "call_name": "Max",
        "registered_name": "Max's Full Name",
        "gender": "Male",
        "breed": "Labrador Retriever",
        "color": "Black",
        "birth_date": "2019-05-10"
    }
    
    # Create the dam
    dam_response = client.post(
        "/api/dogs/",
        data=json.dumps(dam_data),
        content_type="application/json"
    )
    assert dam_response.status_code == 201
    dam = json.loads(dam_response.data)
    
    # Create the sire
    sire_response = client.post(
        "/api/dogs/",
        data=json.dumps(sire_data),
        content_type="application/json"
    )
    assert sire_response.status_code == 201
    sire = json.loads(sire_response.data)
    
    # 2. Create a litter with these dogs
    litter_data = {
        "dam_id": dam["id"],
        "sire_id": sire["id"],
        "whelp_date": "2025-01-01",
        "litter_name": "Daisy and Max's First Litter",
        "expected_size": 6,
        "notes": "Healthy pregnancy"
    }
    
    litter_response = client.post(
        "/api/litters/",
        data=json.dumps(litter_data),
        content_type="application/json"
    )
    assert litter_response.status_code == 201
    litter = json.loads(litter_response.data)
    
    # 3. Add puppies to the litter
    puppy_data = [
        {
            "litter_id": litter["id"],
            "name": "Puppy 1",
            "gender": "Male",
            "color": "Yellow",
            "birth_date": "2025-01-01",
            "status": "Available"
        },
        {
            "litter_id": litter["id"],
            "name": "Puppy 2",
            "gender": "Female",
            "color": "Black",
            "birth_date": "2025-01-01",
            "status": "Available"
        }
    ]
    
    for puppy in puppy_data:
        puppy_response = client.post(
            "/api/puppies/",
            data=json.dumps(puppy),
            content_type="application/json"
        )
        assert puppy_response.status_code == 201
    
    # 4. Verify that the litter has the correct puppies
    litter_puppies_response = client.get(f"/api/litters/{litter['id']}/puppies")
    assert litter_puppies_response.status_code == 200
    puppies = json.loads(litter_puppies_response.data)
    
    assert len(puppies) == 2
    assert puppies[0]["litter_id"] == litter["id"]
    assert puppies[1]["litter_id"] == litter["id"]
    
    # 5. Verify that we can get puppies by litter ID through the puppies API as well
    puppies_by_litter_response = client.get(f"/api/puppies/litter/{litter['id']}")
    assert puppies_by_litter_response.status_code == 200
    puppies_by_litter = json.loads(puppies_by_litter_response.data)
    
    assert len(puppies_by_litter) == 2
    assert puppies_by_litter[0]["litter_id"] == litter["id"]
    assert puppies_by_litter[1]["litter_id"] == litter["id"]
    
    # This verifies that both endpoints correctly use the puppies table, not the dogs table

def test_health_record_workflow(client, mock_db):
    """Test the workflow of creating a dog and adding health records."""
    # 1. Create a dog first
    dog_data = {
        "call_name": "Buddy",
        "registered_name": "Buddy's Full Name",
        "gender": "Male",
        "breed": "Golden Retriever",
        "color": "Golden",
        "birth_date": "2022-03-20"
    }
    
    dog_response = client.post(
        "/api/dogs/",
        data=json.dumps(dog_data),
        content_type="application/json"
    )
    assert dog_response.status_code == 201
    dog = json.loads(dog_response.data)
    
    # 2. Add a health record for the dog
    health_record_data = {
        "dog_id": dog["id"],
        "record_date": "2025-02-15",
        "record_type": "Examination",
        "notes": "Annual checkup",
        "veterinarian": "Dr. Smith"
    }
    
    health_record_response = client.post(
        "/api/health/records",
        data=json.dumps(health_record_data),
        content_type="application/json"
    )
    assert health_record_response.status_code == 201
    health_record = json.loads(health_record_response.data)
    
    # 3. Add a vaccination for the dog
    vaccination_data = {
        "dog_id": dog["id"],
        "vaccination_date": "2025-02-15",
        "vaccine_type": "Rabies",
        "next_due_date": "2026-02-15",
        "administered_by": "Dr. Smith"
    }
    
    vaccination_response = client.post(
        "/api/health/vaccinations",
        data=json.dumps(vaccination_data),
        content_type="application/json"
    )
    assert vaccination_response.status_code == 201
    vaccination = json.loads(vaccination_response.data)
    
    # 4. Verify that the health dashboard shows the correct data
    dashboard_response = client.get("/api/health/dashboard")
    assert dashboard_response.status_code == 200
    dashboard = json.loads(dashboard_response.data)
    
    # Verify upcoming vaccinations
    found_vaccination = False
    for vacc in dashboard["upcoming_vaccinations"]:
        if vacc["id"] == vaccination["id"]:
            found_vaccination = True
            break
    assert found_vaccination, "Vaccination should appear in upcoming vaccinations"
    
    # Verify recent health records
    found_record = False
    for record in dashboard["recent_health_records"]:
        if record["id"] == health_record["id"]:
            found_record = True
            break
    assert found_record, "Health record should appear in recent records"

def test_application_form_workflow(client, mock_db):
    """Test the workflow of creating and submitting an application form."""
    # Create a test user/breeder
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    breeder = mock_db.create("users", {
        "email": "breeder@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "Breeder"
    })
    
    # 1. Create an application form as a breeder
    form_data = {
        "name": "Puppy Application Form",
        "description": "Application for adopting a puppy",
        "is_active": True
    }
    
    # Mock the token verification to return our test breeder
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        form_response = client.post(
            "/api/application-forms",
            data=json.dumps(form_data),
            content_type="application/json"
        )
    
    assert form_response.status_code == 201
    form = json.loads(form_response.data)
    form_id = form["data"]["id"]
    
    # 2. Add questions to the form
    questions_data = [
        {
            "form_id": form_id,
            "question_text": "Why do you want to adopt a puppy?",
            "description": "Please explain your reasons",
            "question_type": "text",
            "is_required": True,
            "order_position": 1
        },
        {
            "form_id": form_id,
            "question_text": "Do you have other pets?",
            "description": "Tell us about your current pets",
            "question_type": "radio",
            "is_required": True,
            "order_position": 2,
            "options": ["Yes", "No"]
        }
    ]
    
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        for question in questions_data:
            question_response = client.post(
                "/api/form-questions",
                data=json.dumps(question),
                content_type="application/json"
            )
            assert question_response.status_code == 201
    
    # 3. Get the form for public view
    public_form_response = client.get(f"/api/public/forms/{form_id}")
    assert public_form_response.status_code == 200
    public_form = json.loads(public_form_response.data)
    
    # Get the question IDs
    questions = public_form["data"]["questions"]
    assert len(questions) == 2
    
    # 4. Submit the form as a potential adopter
    submission_data = {
        "applicant_name": "John Doe",
        "applicant_email": "john@example.com",
        "applicant_phone": "123-456-7890",
        "responses": [
            {
                "question_id": questions[0]["id"],
                "answer": "I've always wanted a dog and now I have the space and time."
            },
            {
                "question_id": questions[1]["id"],
                "answer": "No"
            }
        ]
    }
    
    # Mock the EmailService to prevent actual email sending
    with patch('server.applications.EmailService.send_application_submitted_notification'):
        submission_response = client.post(
            f"/api/public/forms/{form_id}/submit",
            data=json.dumps(submission_data),
            content_type="application/json"
        )
    
    assert submission_response.status_code == 201
    submission = json.loads(submission_response.data)
    
    # 5. Verify the breeder can see the submission
    with patch('server.auth.token_required', lambda f: lambda *args, **kwargs: f(breeder, *args[1:], **kwargs)):
        submissions_response = client.get("/api/form-submissions")
    
    assert submissions_response.status_code == 200
    submissions = json.loads(submissions_response.data)
    assert len(submissions["data"]) > 0
    
    # Find our submission
    found_submission = False
    for sub in submissions["data"]:
        if sub["applicant_email"] == "john@example.com":
            found_submission = True
            break
    
    assert found_submission, "The submitted application should be visible to the breeder"
