"""
Supabase database implementation for the database interface.
"""

import os
from supabase import create_client, Client
from typing import Dict, List, Any, Optional
from .db_interface import DatabaseInterface
from ..config import debug_log
import time
from functools import wraps

def retry_on_disconnect(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if "Server disconnected" in str(e) and retries < max_retries - 1:
                        print(f"Connection lost, retrying in {delay} seconds...")
                        time.sleep(delay)
                        retries += 1
                        continue
                    raise
            return func(*args, **kwargs)
        return wrapper
    return decorator

class DatabaseError(Exception):
    """Custom exception for database errors"""
    pass

class SupabaseDatabase(DatabaseInterface):
    """Database implementation for Supabase"""
    
    def __init__(self, supabase_url=None, supabase_key=None):
        """Initialize Supabase connection with URL and key from parameters or environment variables"""
        if not supabase_url:
            supabase_url = os.environ.get("SUPABASE_URL")
        if not supabase_key:
            supabase_key = os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be provided or set as environment variables")
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    # Standard DatabaseInterface methods
    @retry_on_disconnect()
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        debug_log(f"Supabase: Fetching all records from {table}")
        try:
            response = self.supabase.table(table).select("*").execute()
            debug_log(f"Supabase: Found {len(response.data)} records")
            return response.data
        except Exception as e:
            debug_log(f"Supabase error in get_all: {str(e)}")
            raise DatabaseError(str(e))

    @retry_on_disconnect()
    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        debug_log(f"Supabase: Fetching record from {table} with id {id}")
        try:
            response = self.supabase.table(table).select("*").eq("id", id).execute()
            if not response.data:
                debug_log(f"Supabase: No record found with id {id}")
                return None
            debug_log(f"Supabase: Found record: {response.data[0]}")
            return response.data[0]
        except Exception as e:
            debug_log(f"Supabase error in get_by_id: {str(e)}")
            raise DatabaseError(str(e))

    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        debug_log(f"Supabase: Fetching filtered records from {table} with filters {filters}")
        try:
            query = self.supabase.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            response = query.execute()
            debug_log(f"Supabase: Found {len(response.data)} records")
            return response.data
        except Exception as e:
            debug_log(f"Supabase error in get_filtered: {str(e)}")
            raise DatabaseError(str(e))
    
    # Implementation for the newer interface methods
    def find(self, table: str) -> List[Dict[str, Any]]:
        """Find all records in a table"""
        try:
            response = self.supabase.table(table).select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error in find operation for table {table}: {str(e)}")
            return []
    
    def find_by_field(self, table: str, field: str, value: Any) -> List[Dict[str, Any]]:
        """Find records in a table by field value"""
        try:
            response = self.supabase.table(table).select("*").eq(field, value).execute()
            return response.data
        except Exception as e:
            print(f"Error in find_by_field operation for table {table}, field {field}: {str(e)}")
            return []
    
    def find_by_field_values(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find records in a table by multiple field values (AND condition)"""
        try:
            query = self.supabase.table(table).select("*")
            
            # Apply each filter as an AND condition
            for field, value in filters.items():
                query = query.eq(field, value)
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error in find_by_field_values operation for table {table}, filters {filters}: {str(e)}")
            return []
    
    def get(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Get a single record by ID"""
        try:
            response = self.supabase.table(table).select("*").eq("id", id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error in get operation for table {table}, id {id}: {str(e)}")
            return None
    
    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        try:
            # Write debug directly to server.log
            print(f"SUPABASE DEBUG - Creating record in table {table} with data: {data}")
            
            # Clean data by removing None values and empty strings
            clean_data = {k: v for k, v in data.items() if v is not None and v != ""}
            
            print(f"SUPABASE DEBUG - Clean data for insert: {clean_data}")
            
            response = self.supabase.table(table).insert(clean_data).execute()
            if response.data and len(response.data) > 0:
                print(f"SUPABASE DEBUG - Successfully created record: {response.data[0]}")
                return response.data[0]
            raise DatabaseError("Failed to create record, empty response")
        except Exception as e:
            print(f"SUPABASE ERROR - Error in create operation for table {table}: {str(e)}")
            import traceback
            print(f"SUPABASE ERROR - Traceback: {traceback.format_exc()}")
            raise DatabaseError(f"Failed to create record: {str(e)}")
    
    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record by ID"""
        try:
            print(f"Updating {table} with ID {id}: {data}")
            
            # Clean data for update
            clean_data = {k: v for k, v in data.items()}
            
            response = self.supabase.table(table).update(clean_data).eq("id", id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            
            # If no data returned but no error, get the updated record
            check_response = self.supabase.table(table).select("*").eq("id", id).execute()
            if check_response.data and len(check_response.data) > 0:
                return check_response.data[0]
                
            raise DatabaseError(f"Failed to update record in table {table} with ID {id}, empty response")
        except Exception as e:
            print(f"Error in update operation for table {table}, id {id}: {str(e)}")
            raise DatabaseError(f"Failed to update record: {str(e)}")
    
    def delete(self, table: str, id: int) -> bool:
        """Delete a record by ID"""
        try:
            response = self.supabase.table(table).delete().eq("id", id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error in delete operation for table {table}, id {id}: {str(e)}")
            return False
    