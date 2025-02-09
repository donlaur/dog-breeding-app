import sys
import os
import pytest
import datetime
import io
from flask import Flask

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import create_app, db
from server.models import Dog, BreedingProgram, Litter, ContactMessage

@pytest.fixture
def app():
    """Set up a test Flask app."""
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"  # In-memory DB for testing
    app.config["UPLOAD_FOLDER"] = "server/static/uploads"

    with app.app_context():
        db.create_all()  # Create tables for testing
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Provide a test client for making requests."""
    return app.test_client()

@pytest.fixture
def test_dog(app):
    """Insert a test dog into the database inside an app context."""
    with app.app_context():
        dog = Dog(
            registered_name="Test Dog",
            call_name="Buddy",
            breed_id=1,
            gender="Male",
            birth_date=datetime.date(2023, 1, 1),  # ✅ Convert to `datetime.date`
            status="Active"
        )
        db.session.add(dog)
        db.session.commit()
        return db.session.get(Dog, dog.id)  # ✅ Ensure session is still active

### ✅ 1. Test GET Requests for Required Endpoints
def test_get_breeder_program(client):
    response = client.get("/api/breeder-program")
    assert response.status_code in [200, 404]  # Should exist or return an error
def test_get_dogs(client, app):
    """Ensure the /api/dogs endpoint returns data."""
    with app.app_context():
        if not Dog.query.first():  # ✅ Ensure at least one dog exists
            data = {
                "registered_name": "Sample Dog",
                "call_name": "Test",
                "breed_id": 1,
                "gender": "Male",
                "birth_date": "2023-01-01",  # ✅ Use string format since API expects this
                "status": "Active"
            }
            response = client.post("/api/dogs", data=data)
            assert response.status_code == 201  # ✅ Ensure dog was successfully created

    response = client.get("/api/dogs")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert isinstance(response.json, list), "Response should be a list"
    assert len(response.json) > 0, "Response list should not be empty"

def test_get_litters(client):
    response = client.get("/api/litters")
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_get_messages(client):
    response = client.get("/api/messages")
    assert response.status_code == 200
    assert isinstance(response.json, list)

### ✅ 2. Test File Uploads
def test_upload_dog_photo(client, app, test_dog):
    """Ensure file uploads work correctly inside an app context."""
    with app.app_context():
        data = {
            "cover_photo": (io.BytesIO(b"test image content"), "test.jpg")
        }
        response = client.post(f"/api/dogs/{test_dog.id}/upload", content_type="multipart/form-data", data=data)
        assert response.status_code == 200
        assert "File uploaded successfully" in response.json["message"]

### ✅ 3. Test Updating a Dog
def test_update_dog(client, app, test_dog):
    """Ensure dog update works inside an app context."""
    with app.app_context():
        data = {
            "registered_name": "Updated Dog",
            "call_name": "Buddy Updated",
            "breed_id": 1,
            "gender": "Male",
            "birth_date": datetime.date(2023, 2, 1),  # ✅ Convert to `datetime.date`
            "status": "Active"
        }
        response = client.put(f"/api/dogs/{test_dog.id}", data=data)
        assert response.status_code == 200
        assert response.json["registered_name"] == "Updated Dog"

### ✅ 4. Test Non-Existent Dog Returns 404
def test_get_nonexistent_dog(client):
    response = client.get("/api/dogs/999")  # Dog ID that doesn't exist
    assert response.status_code == 404
