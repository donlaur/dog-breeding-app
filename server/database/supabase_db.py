from typing import List, Dict, Any, Optional
from .db_interface import DatabaseInterface
from server.supabase_client import supabase

class SupabaseDatabase(DatabaseInterface):
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        try:
            response = supabase.table(table).select("*").execute()
            return response.data
        except Exception as e:
            raise DatabaseError(f"Error fetching data from {table}: {str(e)}")

    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table(table).select("*").eq("id", id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise DatabaseError(f"Error fetching {table} with id {id}: {str(e)}")

    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            query = supabase.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            response = query.execute()
            return response.data
        except Exception as e:
            raise DatabaseError(f"Error fetching filtered {table}: {str(e)}")

    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = supabase.table(table).insert(data).execute()
            return response.data[0]
        except Exception as e:
            raise DatabaseError(f"Error creating record in {table}: {str(e)}")

    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = supabase.table(table).update(data).eq("id", id).execute()
            return response.data[0]
        except Exception as e:
            raise DatabaseError(f"Error updating {table} with id {id}: {str(e)}")

    def delete(self, table: str, id: int) -> bool:
        try:
            supabase.table(table).delete().eq("id", id).execute()
            return True
        except Exception as e:
            raise DatabaseError(f"Error deleting from {table} with id {id}: {str(e)}")

class DatabaseError(Exception):
    pass 