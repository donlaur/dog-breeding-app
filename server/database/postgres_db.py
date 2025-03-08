from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from .db_interface import DatabaseInterface

class PostgresDatabase(DatabaseInterface):
    def __init__(self, connection_params: Dict[str, Any]):
        self.conn_params = connection_params

    def get_connection(self):
        return psycopg2.connect(**self.conn_params, cursor_factory=RealDictCursor)

    def get_all(self, table: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {table}")
                return cur.fetchall()

    # Implement other methods similarly... 