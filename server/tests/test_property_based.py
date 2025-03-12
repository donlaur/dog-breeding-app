"""
Property-based tests for the Dog Breeding App.
These tests use hypothesis to generate random inputs and verify that certain properties hold.
"""
import pytest
from hypothesis import given, strategies as st
import json
from datetime import datetime, timedelta

# Custom strategies for our domain
@st.composite
def valid_dog_data(draw):
    """Generate valid dog data."""
    return {
        "call_name": draw(st.text(min_size=1, max_size=50)),
        "registered_name": draw(st.text(min_size=1, max_size=100)),
        "gender": draw(st.sampled_from(["Male", "Female"])),
        "breed": draw(st.text(min_size=1, max_size=50)),
        "color": draw(st.text(min_size=1, max_size=30)),
        "birth_date": draw(st.dates(
            min_value=datetime(2000, 1, 1),
            max_value=datetime.now()
        )).strftime("%Y-%m-%d")
    }

@st.composite
def valid_litter_data(draw, dog_ids):
    """Generate valid litter data given existing dog IDs."""
    if len(dog_ids) < 2:
        # Need at least 2 dogs for dam and sire
        return None
    
    # Pick two different dogs for dam and sire
    dam_id, sire_id = draw(st.sampled_from([(d, s) for d in dog_ids for s in dog_ids if d != s]))
    
    return {
        "dam_id": dam_id,
        "sire_id": sire_id,
        "whelp_date": draw(st.dates(
            min_value=datetime.now() - timedelta(days=365),
            max_value=datetime.now() + timedelta(days=365)
        )).strftime("%Y-%m-%d"),
        "litter_name": draw(st.text(min_size=1, max_size=100)),
        "expected_size": draw(st.integers(min_value=1, max_value=15)),
        "notes": draw(st.text(max_size=500))
    }

@st.composite
def valid_health_record_data(draw, dog_ids):
    """Generate valid health record data given existing dog IDs."""
    if not dog_ids:
        return None
    
    return {
        "dog_id": draw(st.sampled_from(dog_ids)),
        "record_date": draw(st.dates(
            min_value=datetime.now() - timedelta(days=365),
            max_value=datetime.now()
        )).strftime("%Y-%m-%d"),
        "record_type": draw(st.sampled_from([
            "Examination", "Surgery", "Medication", "Test", "Other"
        ])),
        "notes": draw(st.text(max_size=500)),
        "veterinarian": draw(st.text(min_size=1, max_size=100))
    }

# Property-based tests
def test_dog_creation_properties(client, mock_db):
    """Test that dogs can be created with a wide range of valid inputs."""
    @given(dog_data=valid_dog_data())
    def test_create_dog(dog_data):
        response = client.post(
            "/api/dogs/",
            data=json.dumps(dog_data),
            content_type="application/json"
        )
        
        # Should always succeed with valid data
        assert response.status_code in (200, 201)
        
        # The returned dog should have the same data we sent
        dog = json.loads(response.data)
        for key, value in dog_data.items():
            assert dog[key] == value
    
    test_create_dog()

def test_database_query_pattern_properties(mock_db):
    """Test that the database query pattern is robust with various inputs."""
    @given(
        table=st.sampled_from(["dogs", "puppies", "litters", "health_records"]),
        field_name=st.text(min_size=1, max_size=30),
        field_value=st.one_of(
            st.integers(),
            st.text(),
            st.booleans(),
            st.lists(st.integers(), max_size=5)
        )
    )
    def test_find_by_field_values(table, field_name, field_value):
        # The method should handle various input types without crashing
        try:
            result = mock_db.find_by_field_values(table, {field_name: field_value})
            # Result should always be a list
            assert isinstance(result, list)
        except Exception as e:
            # The only acceptable exceptions are for invalid table names
            # or if the field_value is not a valid type for database queries
            assert "table not found" in str(e).lower() or "invalid type" in str(e).lower()
    
    test_find_by_field_values()

def test_puppies_dogs_separation_property(mock_db):
    """Test that puppies and dogs tables are always kept separate."""
    @given(
        litter_id=st.integers(min_value=1, max_value=1000)
    )
    def test_separation(litter_id):
        # Setup: Create a litter and add puppies to it
        litter = mock_db.create("litters", {
            "dam_id": 1,
            "sire_id": 2,
            "whelp_date": "2025-01-01",
            "litter_name": f"Test Litter {litter_id}",
            "expected_size": 5
        })
        
        # Add puppies to this litter
        for i in range(3):
            mock_db.create("puppies", {
                "litter_id": litter["id"],
                "name": f"Puppy {i}",
                "gender": "Male" if i % 2 == 0 else "Female",
                "color": "Black",
                "birth_date": "2025-01-01",
                "status": "Available"
            })
        
        # Property: find_by_field_values on puppies table should return puppies
        puppies = mock_db.find_by_field_values("puppies", {"litter_id": litter["id"]})
        assert len(puppies) == 3
        for puppy in puppies:
            assert "litter_id" in puppy
            assert puppy["litter_id"] == litter["id"]
        
        # Property: find_by_field_values on dogs table should NOT return these puppies
        # (even if we incorrectly query the dogs table)
dogs = mock_db.find_by_field_values("puppies", {"litter_id": litter["id"]})
        assert len(dogs) == 0
    
    test_separation()

def test_error_handling_properties(client, mock_db):
    """Test that error handling is consistent across all endpoints."""
    @given(
        endpoint=st.sampled_from([
            "/api/dogs/999999",
            "/api/puppies/999999",
            "/api/litters/999999",
            "/api/health/records/999999",
            "/api/health/vaccinations/999999",
            "/api/application-forms/999999"
        ])
    )
    def test_not_found_responses(endpoint):
        # Property: All endpoints should return 404 for non-existent resources
        response = client.get(endpoint)
        assert response.status_code == 404
        
        # Property: Error responses should have a consistent format
        error_data = json.loads(response.data)
        assert "error" in error_data or "success" in error_data and not error_data["success"]
    
    test_not_found_responses()
