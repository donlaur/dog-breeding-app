"""
This is a standalone test app that can be used to test the CMS API without the main app.
Run it with: python test_pages_api.py
"""

from flask import Flask, jsonify, Blueprint
import os

# Simple mock database
class MockDB:
    def __init__(self):
        self.pages = []

# Create a CMS pages blueprint
def create_pages_blueprint(db):
    # Use a unique name for the blueprint
    pages_bp = Blueprint('cms_pages', __name__)
    
    @pages_bp.route('/test', methods=['GET'])
    def test_route():
        return jsonify({"message": "Pages API is working!"}), 200
    
    @pages_bp.route('', methods=['GET'])
    def get_all_pages():
        # Return mock data
        test_pages = [
            {
                "id": 1,
                "title": "About Us",
                "slug": "about-us",
                "content": "<p>This is a test page about us.</p>",
                "template": "about",
                "status": "published",
                "created_at": "2025-03-05T00:00:00",
                "updated_at": "2025-03-05T00:00:00"
            },
            {
                "id": 2,
                "title": "Contact Us",
                "slug": "contact",
                "content": "<p>Contact information here.</p>",
                "template": "contact",
                "status": "published",
                "created_at": "2025-03-05T00:00:00",
                "updated_at": "2025-03-05T00:00:00"
            }
        ]
        return jsonify(test_pages), 200
    
    return pages_bp

# Create a new standalone Flask app
app = Flask(__name__)

# Create a mock database
db = MockDB()

# Create the blueprint
pages_bp = create_pages_blueprint(db)

print(f"Blueprint created: {pages_bp}")
print(f"Blueprint name: {pages_bp.name}")
print(f"Blueprint import_name: {pages_bp.import_name}")

# Register the blueprint with the app
app.register_blueprint(pages_bp, url_prefix='/api/pages')

# Add a simple route to the main app
@app.route('/')
def hello():
    return "CMS API Test! Try /api/pages or /api/pages/test"

if __name__ == '__main__':
    print("\n=== Environment ===")
    print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
    print(f"Working directory: {os.getcwd()}")
    
    # Print all registered routes
    print("\n=== Registered routes: ===")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    print("\n")
    
    # Run the app on port 5001 to avoid conflicts
    app.run(debug=True, port=5001)