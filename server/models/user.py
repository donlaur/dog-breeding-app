from datetime import datetime
from server.database import SupabaseDatabase

class User:
    def __init__(self, id=None, email=None, name=None, password_hash=None, created_at=None, updated_at=None):
        self.id = id
        self.email = email
        self.name = name
        self.password_hash = password_hash
        self.created_at = created_at
        self.updated_at = updated_at
    
    @classmethod
    def create_table(cls, db):
        # SQL to create the users table in Supabase
        query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        db.execute_query(query)
    
    @classmethod
    def find_by_email(cls, db, email):
        query = "SELECT * FROM users WHERE email = %s"
        params = (email,)
        result = db.execute_query(query, params)
        if result and len(result) > 0:
            user_data = result[0]
            return cls(
                id=user_data['id'],
                email=user_data['email'],
                name=user_data['name'],
                password_hash=user_data['password_hash'],
                created_at=user_data['created_at'],
                updated_at=user_data['updated_at']
            )
        return None
    
    @classmethod
    def create(cls, db, email, name, password_hash):
        query = """
        INSERT INTO users (email, name, password_hash)
        VALUES (%s, %s, %s)
        RETURNING id, email, name, password_hash, created_at, updated_at
        """
        params = (email, name, password_hash)
        result = db.execute_query(query, params)
        if result and len(result) > 0:
            user_data = result[0]
            return cls(
                id=user_data['id'],
                email=user_data['email'],
                name=user_data['name'],
                password_hash=user_data['password_hash'],
                created_at=user_data['created_at'],
                updated_at=user_data['updated_at']
            )
        return None 