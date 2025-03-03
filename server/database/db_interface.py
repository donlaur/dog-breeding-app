from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from ..config import debug_log

class DatabaseInterface(ABC):
    @abstractmethod
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        """Retrieve all records from a table"""
        debug_log(f"DatabaseInterface: Getting all records from {table}")
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Retrieve a single record by ID"""
        debug_log(f"DatabaseInterface: Getting record from {table} with id {id}")
        raise NotImplementedError

    @abstractmethod
    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve records matching filter criteria"""
        debug_log(f"DatabaseInterface: Getting filtered records from {table} with filters {filters}")
        raise NotImplementedError

    @abstractmethod
    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        debug_log(f"DatabaseInterface: Creating record in {table} with data {data}")
        raise NotImplementedError

    @abstractmethod
    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing record"""
        debug_log(f"DatabaseInterface: Updating record in {table} with id {id} with data {data}")
        raise NotImplementedError

    @abstractmethod
    def delete(self, table: str, id: int) -> bool:
        """Delete a record"""
        debug_log(f"DatabaseInterface: Deleting record from {table} with id {id}")
        raise NotImplementedError

    def find(self, table_name):
        """Find all records in a table."""
        pass

    def find_by_field(self, table_name, field_name, field_value):
        """Find records in a table where field_name equals field_value."""
        pass

    def get(self, table_name, item_id):
        """Get a single record by ID."""
        pass

    def create(self, table_name, data):
        """Create a new record."""
        pass

    def update(self, table_name, item_id, data):
        """Update an existing record."""
        pass

    def delete(self, table_name, item_id):
        """Delete a record."""
        pass
