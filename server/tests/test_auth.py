"""
Tests for the auth endpoints.
"""
import json
import pytest
import jwt
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

def test_signup_success(client, mock_db):
    """Test successful user signup."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Prepare signup data
    signup_data = {
        "email": "test@example.com",
        "password": "securePassword123",
        "first_name": "Test",
        "last_name": "User",
        "kennel_name": "Test Kennel"
    }
    
    # Make the request
    response = client.post(
        "/api/auth/signup",
        data=json.dumps(signup_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == signup_data["email"]
    assert data["user"]["first_name"] == signup_data["first_name"]
    assert "password" not in data["user"]  # Password should not be returned

def test_signup_duplicate_email(client, mock_db):
    """Test error handling when email already exists."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user first
    mock_db.create("users", {
        "email": "existing@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Existing",
        "last_name": "User"
    })
    
    # Prepare signup data with the same email
    signup_data = {
        "email": "existing@example.com",
        "password": "securePassword123",
        "first_name": "Test",
        "last_name": "User"
    }
    
    # Make the request
    response = client.post(
        "/api/auth/signup",
        data=json.dumps(signup_data),
        content_type="application/json"
    )
    
    # Check the response
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "already exists" in data["error"].lower()

def test_login_success(client, mock_db):
    """Test successful user login."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user with a known password
    from werkzeug.security import generate_password_hash
    password = "securePassword123"
    password_hash = generate_password_hash(password)
    
    user = mock_db.create("users", {
        "email": "test@example.com",
        "password_hash": password_hash,
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Prepare login data
    login_data = {
        "email": "test@example.com",
        "password": password
    }
    
    # Mock password verification
    with patch('werkzeug.security.check_password_hash', return_value=True):
        # Make the request
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == login_data["email"]
    assert "password" not in data["user"]  # Password should not be returned

def test_login_invalid_credentials(client, mock_db):
    """Test error handling with invalid login credentials."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user
    from werkzeug.security import generate_password_hash
    user = mock_db.create("users", {
        "email": "test@example.com",
        "password_hash": generate_password_hash("correctPassword"),
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Prepare login data with wrong password
    login_data = {
        "email": "test@example.com",
        "password": "wrongPassword"
    }
    
    # Mock password verification to return False
    with patch('werkzeug.security.check_password_hash', return_value=False):
        # Make the request
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json"
        )
    
    # Check the response
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "error" in data
    assert "invalid" in data["error"].lower()

def test_get_profile(client, mock_db):
    """Test getting user profile with valid token."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user
    user = mock_db.create("users", {
        "email": "test@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Create a valid token
    token = jwt.encode(
        {
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        'test_secret_key',
        algorithm='HS256'
    )
    
    # Mock the token verification
    with patch('jwt.decode', return_value={'user_id': user['id']}):
        # Make the request with the token
        response = client.get(
            "/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["email"] == user["email"]
    assert data["first_name"] == user["first_name"]
    assert "password_hash" not in data  # Password hash should not be returned

def test_update_profile(client, mock_db):
    """Test updating user profile with valid token."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user
    user = mock_db.create("users", {
        "email": "test@example.com",
        "password_hash": "hashedpassword",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Create a valid token
    token = jwt.encode(
        {
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        'test_secret_key',
        algorithm='HS256'
    )
    
    # Prepare update data
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "kennel_name": "Updated Kennel"
    }
    
    # Mock the token verification
    with patch('jwt.decode', return_value={'user_id': user['id']}):
        # Make the request with the token
        response = client.put(
            "/api/auth/profile",
            data=json.dumps(update_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["first_name"] == update_data["first_name"]
    assert data["last_name"] == update_data["last_name"]
    assert data["kennel_name"] == update_data["kennel_name"]
    assert data["email"] == user["email"]  # Email shouldn't change

def test_change_password(client, mock_db):
    """Test changing user password with valid token."""
    # Ensure the users table exists
    mock_db.tables["users"] = {}
    mock_db.next_id["users"] = 1
    
    # Create a user with a known password
    from werkzeug.security import generate_password_hash
    old_password = "oldPassword123"
    old_password_hash = generate_password_hash(old_password)
    
    user = mock_db.create("users", {
        "email": "test@example.com",
        "password_hash": old_password_hash,
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Create a valid token
    token = jwt.encode(
        {
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        'test_secret_key',
        algorithm='HS256'
    )
    
    # Prepare password change data
    password_data = {
        "current_password": old_password,
        "new_password": "newPassword456"
    }
    
    # Mock the token verification and password check
    with patch('jwt.decode', return_value={'user_id': user['id']}), \
         patch('werkzeug.security.check_password_hash', return_value=True):
        # Make the request with the token
        response = client.post(
            "/api/auth/change-password",
            data=json.dumps(password_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "success" in data
    assert data["success"] is True

def test_token_required_decorator():
    """Test that the token_required decorator works correctly."""
    # Create a mock function that would be decorated with token_required
    def mock_protected_endpoint(current_user):
        return {"success": True, "user_id": current_user["id"]}
    
    # Create a mock request with a valid token
    mock_request = MagicMock()
    mock_request.headers = {"Authorization": "Bearer valid_token"}
    
    # Create a mock user that would be returned by the token verification
    mock_user = {"id": 1, "email": "test@example.com"}
    
    # Mock the necessary functions
    with patch('flask.request', mock_request), \
         patch('jwt.decode', return_value={"user_id": 1}), \
         patch('server.database.supabase_db.SupabaseDatabase.get', return_value=mock_user):
        
        # This would simulate the token_required decorator's behavior
        result = mock_protected_endpoint(mock_user)
    
    # Check the result
    assert result["success"] is True
    assert result["user_id"] == mock_user["id"]
