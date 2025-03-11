"""
Root-level app.py for the Dog Breeding App.

This file is placed at the root of the repository (above the server folder)
and serves as the entry point for running the application. It imports the
create_app function from the server module and runs the app. Environment variables
are loaded automatically via the server's configuration.
"""

from server import create_app
from flask_cors import CORS
import os
import sys

# Add the current directory to the Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    app = create_app()
    # Apply CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Print all registered routes before running
    print("\n=== Registered routes: ===")
    rules = list(app.url_map.iter_rules())
    rules.sort(key=lambda x: x.rule)
    for rule in rules:
        print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    
    print("\n=== Starting server... ===")
    app.run(host='0.0.0.0', port=5000, debug=True)
