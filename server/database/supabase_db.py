from typing import List, Dict, Any, Optional
from .db_interface import DatabaseInterface
from ..config import debug_log
from supabase import create_client
import os
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

class SupabaseDatabase(DatabaseInterface):
    _instance = None
    _client = None
    _url = None
    _key = None

    def __new__(cls, url=None, key=None):
        if cls._instance is None:
            cls._instance = super(SupabaseDatabase, cls).__new__(cls)
            cls._url = url or os.getenv("SUPABASE_URL")
            cls._key = key or os.getenv("SUPABASE_KEY")
        return cls._instance

    def __init__(self, url=None, key=None):
        if not self._client:
            self._initialize_client()

    def _initialize_client(self):
        if not self._url or not self._key:
            raise ValueError("Missing Supabase credentials")
        self._client = create_client(self._url, self._key)

    @property
    def supabase(self):
        if not self._client:
            self._initialize_client()
        return self._client

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

    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        debug_log(f"Supabase: Creating record in {table} with data {data}")
        try:
            response = self.supabase.table(table).insert(data).execute()
            debug_log(f"Supabase: Created record: {response.data[0]}")
            return response.data[0]
        except Exception as e:
            debug_log(f"Supabase error in create: {str(e)}")
            raise DatabaseError(str(e))

    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        debug_log(f"Supabase: Updating record in {table} with id {id} with data {data}")
        try:
            response = self.supabase.table(table).update(data).eq("id", id).execute()
            debug_log(f"Supabase: Updated record: {response.data[0]}")
            return response.data[0]
        except Exception as e:
            debug_log(f"Supabase error in update: {str(e)}")
            raise DatabaseError(str(e))

    def delete(self, table: str, id: int) -> None:
        debug_log(f"Supabase: Deleting record from {table} with id {id}")
        try:
            self.supabase.table(table).delete().eq("id", id).execute()
            debug_log(f"Supabase: Successfully deleted record with id {id}")
        except Exception as e:
            debug_log(f"Supabase error in delete: {str(e)}")
            raise DatabaseError(str(e))

class DatabaseError(Exception):
    pass 