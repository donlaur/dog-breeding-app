"""
Database interface for abstracting database operations.
This should be implemented by all database providers.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from ..config import debug_log

class DatabaseInterface(ABC):
    """Abstract base class for database operations"""
    
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

    @abstractmethod
    def find(self, table: str) -> List[Dict[str, Any]]:
        """Find all records in a table"""
        pass
        
    @abstractmethod
    def find_by_field(self, table: str, field: str, value: Any) -> List[Dict[str, Any]]:
        """Find records in a table by field value"""
        pass
        
    @abstractmethod
    def get(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Get a single record by ID"""
        pass
        
    @abstractmethod
    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        pass
        
    @abstractmethod
    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record by ID"""
        pass
        
    @abstractmethod
    def delete(self, table: str, id: int) -> bool:
        """Delete a record by ID"""
        pass
