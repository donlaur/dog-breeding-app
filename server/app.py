"""
app.py

Application factory for the Dog Breeding App.
Creates the Flask app, loads environment variables, and registers blueprints.
"""

from flask import Flask
from flask_cors import CORS  # <-- Import here
from dotenv import load_dotenv
from server.dogs import dogs_bp
from server.breeds import breeds_bp
from server.litters import litters_bp
from server.heat_cycles import heat_bp  
from server.program import program_bp  # <-- our new blueprint

def create_app():
    load_dotenv()  # Load environment variables from .env
    app = Flask(__name__)

    # Apply CORS to all /api routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints with URL prefixes for modular routing.
    app.register_blueprint(dogs_bp, url_prefix="/api/dogs")
    app.register_blueprint(breeds_bp, url_prefix="/api/breeds")
    app.register_blueprint(litters_bp, url_prefix="/api/litters")
    app.register_blueprint(heat_bp, url_prefix="/api/heat-cycles")
    app.register_blueprint(program_bp, url_prefix="/api/program")
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
