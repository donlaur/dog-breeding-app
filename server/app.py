"""
app.py

Application factory for the Dog Breeding App.
Creates the Flask app, loads environment variables, and registers blueprints.
"""

from flask import Flask
from dotenv import load_dotenv
from server.dogs import dogs_bp
from server.breeds import breeds_bp  # If you have breed endpoints in a separate blueprint
from server.litters import litters_bp  # New blueprint for litter endpoints
from server.heat_cycles import heat_bp  # <-- new blueprint for heat cycles

def create_app():
    load_dotenv()  # Load environment variables from .env
    app = Flask(__name__)
    
    # Register blueprints with URL prefixes for modular routing.
    app.register_blueprint(dogs_bp, url_prefix="/api/dogs")
    app.register_blueprint(breeds_bp, url_prefix="/api/breeds")  # Optional, if implemented
    app.register_blueprint(litters_bp, url_prefix="/api/litters")
    app.register_blueprint(heat_bp, url_prefix="/api/heat-cycles")  # register here
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
