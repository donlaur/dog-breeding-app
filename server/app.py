"""
app.py

Simple entrypoint that creates the Flask app using the factory in __init__.py
"""

from flask import Flask, jsonify
from server.database.supabase_db import SupabaseDatabase
from server.config import debug_log
from server.utils.response_utils import error_response
import traceback

# Import blueprints
from server.dogs import create_dogs_bp
from server.litters import create_litters_bp
from server.breeds import breeds_bp
from server.heats import create_heats_bp
from server.auth import create_auth_bp

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
    
    # Global error handler to ensure JSON responses
    @app.errorhandler(404)
    def not_found_error(error):
        debug_log(f"404 Error: {error}")
        return error_response("Resource not found", status=404)
    
    @app.errorhandler(500)
    def internal_error(error):
        debug_log(f"500 Error: {error}")
        debug_log(traceback.format_exc())
        return error_response("Internal server error", status=500, 
                            error_details=str(error))
    
    @app.errorhandler(Exception)
    def unhandled_exception(error):
        debug_log(f"Unhandled Exception: {error}")
        debug_log(traceback.format_exc())
        return error_response("An unexpected error occurred", status=500,
                            error_details=str(error))
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
