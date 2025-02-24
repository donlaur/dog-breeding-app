from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class DatabaseInterface(ABC):
    @abstractmethod
    def get_all(self, table: str) -> List[Dict[str, Any]]:
        """Retrieve all records from a table"""
        pass

    @abstractmethod
    def get_by_id(self, table: str, id: int) -> Optional[Dict[str, Any]]:
        """Retrieve a single record by ID"""
        pass

    @abstractmethod
    def get_filtered(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve records matching filter criteria"""
        pass

    @abstractmethod
    def create(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        pass

    @abstractmethod
    def update(self, table: str, id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing record"""
        pass

    @abstractmethod
    def delete(self, table: str, id: int) -> bool:
        """Delete a record"""
        pass
