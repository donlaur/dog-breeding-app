"""
app.py

Simple entrypoint that creates the Flask app using the factory in __init__.py
"""

from flask import Flask, jsonify
from flask_cors import CORS  # Import CORS
from server.database.supabase_db import SupabaseDatabase
from server.config import debug_log

# Import blueprints
from server.dogs import create_dogs_bp
from server.litters import create_litters_bp
from server.breeds import breeds_bp
from server.heats import create_heats_bp
from server.auth import create_auth_bp
from server.program import create_program_bp
from server.puppies import create_puppies_bp
from server.photos import create_photos_bp

# Try importing pages blueprint with exception handling
try:
    from server.pages import create_pages_blueprint
    print("Successfully imported create_pages_blueprint")
except Exception as e:
    print(f"Error importing create_pages_blueprint: {e}")
    # Define a placeholder function
    def create_pages_blueprint(db):
        from flask import Blueprint
        return Blueprint('pages', __name__)

def create_app():
    app = Flask(__name__)
    
    # Setup CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Create database interface
    db = SupabaseDatabase()
    
    # Register blueprints
    app.register_blueprint(create_dogs_bp(db), url_prefix='/api/dogs')
    app.register_blueprint(create_litters_bp(db), url_prefix='/api/litters')
    app.register_blueprint(breeds_bp, url_prefix='/api/breeds')
    app.register_blueprint(create_heats_bp(db), url_prefix='/api/heats')
    app.register_blueprint(create_auth_bp(db), url_prefix='/api/auth')
    app.register_blueprint(create_program_bp(db), url_prefix='/api/program')
    app.register_blueprint(create_puppies_bp(db), url_prefix='/api/puppies')
    app.register_blueprint(create_photos_bp(db), url_prefix='/api/photos')
    
    # Debug pages blueprint - add more detailed debugging
    try:
        print("Attempting to create pages blueprint...")
        pages_bp = create_pages_blueprint(db)
        print(f"Pages blueprint created successfully: {pages_bp}")
        
        print("Attempting to register pages blueprint...")
        app.register_blueprint(pages_bp, url_prefix='/api/pages')
        print("Pages blueprint registered successfully")
        
        # Print all routes after registration
        print("\nRoutes after registering pages blueprint:")
        for rule in app.url_map.iter_rules():
            if 'pages' in rule.rule:
                print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    except Exception as e:
        import traceback
        print(f"Error registering pages blueprint: {e}")
        print(traceback.format_exc())
    
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
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Start the Flask server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    args = parser.parse_args()
    
    app = create_app()
    app.run(debug=True, port=args.port)
