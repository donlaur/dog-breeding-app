from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from server.database.supabase_db import SupabaseDatabase
from server.database.db_interface import DatabaseInterface

# Load environment variables from .env
load_dotenv()

def get_db() -> DatabaseInterface:
    """Factory function to create database instance"""
    # You could use environment variables or config to determine which DB to use
    return SupabaseDatabase()

def create_app(database: DatabaseInterface = None):
    app = Flask(__name__)
    CORS(app)

    # Use provided database or create new instance
    db = database or get_db()

    # Import blueprints
    from server.dogs import create_dogs_bp
    from server.breeds import create_breeds_bp
    from server.litters import create_litters_bp
    from server.heat_cycles import create_heat_bp
    from server.program import create_program_bp
    from server.routes import main_bp

    # Register blueprints with their URL prefixes
    app.register_blueprint(main_bp)
    app.register_blueprint(create_dogs_bp(db), url_prefix="/api/dogs")
    app.register_blueprint(create_breeds_bp(db), url_prefix="/api/breeds")
    app.register_blueprint(create_litters_bp(db), url_prefix="/api/litters")
    app.register_blueprint(create_heat_bp(db), url_prefix="/api/heat-cycles")
    app.register_blueprint(create_program_bp(db), url_prefix="/api/program")

    return app