from typing import Dict, List, Any, Optional
from ..config import debug_log

class DatabaseInterface:
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        debug_log(f"DatabaseInterface: Getting all records from {table}")
        raise NotImplementedError

    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        debug_log(f"DatabaseInterface: Getting record from {table} with id {id}")
        raise NotImplementedError

    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        debug_log(f"DatabaseInterface: Getting filtered records from {table} with filters {filters}")
        raise NotImplementedError

    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        debug_log(f"DatabaseInterface: Creating record in {table} with data {data}")
        raise NotImplementedError

    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        debug_log(f"DatabaseInterface: Updating record in {table} with id {id} with data {data}")
        raise NotImplementedError

    def delete(self, table: str, id: int) -> None:
        debug_log(f"DatabaseInterface: Deleting record from {table} with id {id}")
        raise NotImplementedError

class DatabaseError(Exception):
    pass 