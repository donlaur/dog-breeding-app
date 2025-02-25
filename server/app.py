"""
app.py

Application factory for the Dog Breeding App.
Creates the Flask app, loads environment variables, and registers blueprints.
"""

from flask import Flask
from flask_cors import CORS  # <-- Import here
from dotenv import load_dotenv
from server.dogs import dogs_bp
from server.breeds import breeds_bp  # Import the blueprint directly
from server.litters import litters_bp
from server.heats import create_heats_bp  # Updated to match new name
from server.program import program_bp  # <-- our new blueprint
from server.database import SupabaseDatabase
from server.puppies import create_puppies_bp  # Updated import path

def create_app():
    load_dotenv()  # Load environment variables from .env
    app = Flask(__name__)

    # More explicit CORS settings
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "supports_credentials": True
        }
    })

    # Initialize database
    db = SupabaseDatabase()

    print("\n=== Registering blueprints... ===")
    
    # Register blueprints
    app.register_blueprint(dogs_bp, url_prefix="/api/dogs")
    print("✓ Registered dogs_bp")
    
    app.register_blueprint(breeds_bp, url_prefix="/api/breeds")
    print("✓ Registered breeds_bp")
    
    app.register_blueprint(litters_bp, url_prefix="/api/litters")
    print("✓ Registered litters_bp")
    
    app.register_blueprint(create_heats_bp(db), url_prefix="/api/heats")
    print("✓ Registered heats_bp")
    
    app.register_blueprint(program_bp, url_prefix="/api/program")
    print("✓ Registered program_bp")

    print("\n=== Registered routes: ===")
    rules = list(app.url_map.iter_rules())
    rules.sort(key=lambda x: x.rule)  # Sort routes alphabetically
    for rule in rules:
        print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
