from typing import List, Dict, Any, Optional
from .db_interface import DatabaseInterface
from ..config import debug_log
from supabase import create_client, Client

class SupabaseDatabase(DatabaseInterface):
    def __init__(self, url: str, key: str):
        debug_log("Initializing Supabase database connection")
        self.supabase: Client = create_client(url, key)

    def get_all(self, table: str) -> List[Dict[str, Any]]:
        debug_log(f"Supabase: Fetching all records from {table}")
        try:
            response = self.supabase.table(table).select("*").execute()
            debug_log(f"Supabase: Found {len(response.data)} records")
            return response.data
        except Exception as e:
            debug_log(f"Supabase error in get_all: {str(e)}")
            raise DatabaseError(str(e))

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