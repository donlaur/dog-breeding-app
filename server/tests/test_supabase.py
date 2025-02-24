import pytest
from server.database.supabase_db import SupabaseDatabase
from server.config import SUPABASE_URL, SUPABASE_KEY

@pytest.fixture
def db():
    return SupabaseDatabase(SUPABASE_URL, SUPABASE_KEY)

# Your test cases here... 