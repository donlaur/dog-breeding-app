"""
app.py

Simple entrypoint that creates the Flask app using the factory in __init__.py
"""

from flask import Flask, jsonify
from server.database.supabase_db import SupabaseDatabase
from server.config import debug_log

# Import blueprints
from server.dogs import create_dogs_bp
from server.litters import create_litters_bp
from server.breeds import breeds_bp
from server.heats import create_heats_bp
from server.auth import create_auth_bp
from server.program import create_program_bp

def create_app():
    app = Flask(__name__)
    
    # Create database interface
    db = SupabaseDatabase()
    
    # Register blueprints
    app.register_blueprint(create_dogs_bp(db), url_prefix='/api/dogs')
    app.register_blueprint(create_litters_bp(db), url_prefix='/api/litters')
    app.register_blueprint(breeds_bp, url_prefix='/api/breeds')
    app.register_blueprint(create_heats_bp(db), url_prefix='/api/heats')
    app.register_blueprint(create_auth_bp(db), url_prefix='/api/auth')
    app.register_blueprint(create_program_bp(db), url_prefix='/api/program')
    
    # Basic error handler just for 404 errors
    @app.errorhandler(404)
    def not_found_error(error):
        debug_log(f"404 Error: {error}")
        response = jsonify({"error": "Resource not found"})
        response.status_code = 404
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5001)
