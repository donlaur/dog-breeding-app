from unittest.mock import Mock
from server.dogs import create_dogs_bp

def test_get_all_dogs():
    # Create a mock database
    mock_db = Mock()
    mock_db.get_all.return_value = [{"id": 1, "name": "Rex"}]
    
    # Create blueprint with mock db
    dogs_bp = create_dogs_bp(mock_db)
    
    # Test the route
    # ... rest of test code ... 