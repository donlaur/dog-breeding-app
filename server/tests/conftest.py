"""
Test configuration for the Dog Breeding App server.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from typing import List, Dict, Any, Optional

# Add the parent directory to sys.path to allow imports from server module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from server.app import create_app
from server.database.db_interface import DatabaseInterface

class MockDatabase(DatabaseInterface):
    """Mock database for testing."""
    
    def __init__(self):
        self.tables = {
            "litters": {},
            "puppies": {},
            "dogs": {}
        }
        self.next_id = {table: 1 for table in self.tables}
    
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        """Retrieve all records from a table"""
        return list(self.tables.get(table, {}).values())
    
    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Retrieve a single record by ID"""
        return self.tables.get(table, {}).get(id)
    
    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve records matching filter criteria"""
        return self.find_by_field_values(table, filters)
    
    def find(self, table: str) -> List[Dict[str, Any]]:
        """Find all records in a table."""
        return list(self.tables.get(table, {}).values())
    
    def find_by_field(self, table: str, field: str, value: Any) -> List[Dict[str, Any]]:
        """Find records in a table by field value"""
        results = []
        for record in self.tables.get(table, {}).values():
            if record.get(field) == value:
                results.append(record)
        return results
    
    def find_by_field_values(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find records by field values."""
        results = []
        for record in self.tables.get(table, {}).values():
            match = True
            for field, value in filters.items():
                if record.get(field) != value:
                    match = False
                    break
            if match:
                results.append(record)
        return results
    
    def get(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Get a record by ID."""
        return self.tables.get(table, {}).get(id)
    
    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record."""
        id = self.next_id[table]
        self.next_id[table] += 1
        data["id"] = id
        self.tables[table][id] = data
        return data
    
    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record."""
        if id not in self.tables.get(table, {}):
            return None
        self.tables[table][id].update(data)
        return self.tables[table][id]
    
    def delete(self, table: str, id: int) -> bool:
        """Delete a record."""
        if id not in self.tables.get(table, {}):
            return False
        del self.tables[table][id]
        return True

@pytest.fixture
def mock_db():
    """Create a mock database for testing."""
    db = MockDatabase()
    
    # Add test data
    dam = db.create("dogs", {"call_name": "TestDam", "gender": "Female"})
    sire = db.create("dogs", {"call_name": "TestSire", "gender": "Male"})
    
    # Create test litter
    litter = db.create("litters", {
        "dam_id": dam["id"],
        "sire_id": sire["id"],
        "whelp_date": "2025-01-01",
        "litter_name": "Test Litter"
    })
    
    # Create test puppies
    for i in range(3):
        db.create("puppies", {
            "litter_id": litter["id"],
            "name": f"Puppy {i+1}",
            "gender": "Male" if i % 2 == 0 else "Female",
            "birth_date": "2025-01-01",
            "color": "Test Color"
        })
    
    return db

@pytest.fixture
def app(mock_db):
    """Create a test Flask app."""
    with patch('server.app.SupabaseDatabase', return_value=mock_db):
        app = create_app()
        app.config['TESTING'] = True
        yield app

@pytest.fixture
def client(app):
    """Create a test client."""
    with app.test_client() as client:
        yield client
