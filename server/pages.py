from flask import Blueprint, request, jsonify
import traceback

# Better debug info
print("===== Initializing pages module =====")

# Check if Page model exists
try:
    from server.models import Page
    print("Successfully imported Page model")
except ImportError as e:
    print(f"Error importing Page model: {e}")
    # Fallback definition for testing
    class Page:
        @staticmethod
        def get_all():
            return []
        
        @staticmethod
        def get_by_id(page_id):
            return None
        
        @staticmethod
        def get_by_slug(slug):
            return None
        
        @staticmethod
        def create_page(**kwargs):
            return None
        
        @staticmethod
        def update_page(page_id, data):
            return None
        
        @staticmethod
        def delete_page(page_id):
            return None

from server.middleware.auth import token_required

def create_pages_blueprint(db):
    print("Creating pages blueprint")
    
    # Make sure blueprint has a unique name to avoid collisions
    pages_bp = Blueprint('cms_pages', __name__)
    
    # Add a simple test route
    @pages_bp.route('/test', methods=['GET'])
    def test_route():
        return jsonify({"message": "Pages API is working!"}), 200

    @pages_bp.route('', methods=['GET'])
    def get_all_pages():
        try:
            # For testing, return a hard-coded response
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
            print("Returning test pages from API")
            return jsonify(test_pages), 200
        except Exception as e:
            print(f"Error in get_all_pages: {e}")
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['GET'])
    def get_page_by_id(page_id):
        try:
            # For testing, return mock data
            if page_id == 1:
                page = {
                    "id": 1,
                    "title": "About Us",
                    "slug": "about-us",
                    "content": "<p>This is a test page about us.</p>",
                    "template": "about",
                    "status": "published",
                    "meta_description": "Learn about our breeding program",
                    "created_at": "2025-03-05T00:00:00",
                    "updated_at": "2025-03-05T00:00:00"
                }
                return jsonify(page), 200
            elif page_id == 2:
                page = {
                    "id": 2,
                    "title": "Contact Us",
                    "slug": "contact",
                    "content": "<p>Contact information here.</p>",
                    "template": "contact",
                    "status": "published",
                    "meta_description": "Get in touch with us",
                    "created_at": "2025-03-05T00:00:00",
                    "updated_at": "2025-03-05T00:00:00"
                }
                return jsonify(page), 200
            else:
                return jsonify({"error": "Page not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/slug/<slug>', methods=['GET'])
    def get_page_by_slug(slug):
        try:
            # For testing, return mock data
            if slug == "about-us":
                page = {
                    "id": 1,
                    "title": "About Us",
                    "slug": "about-us",
                    "content": "<p>This is a test page about us.</p>",
                    "template": "about",
                    "status": "published",
                    "meta_description": "Learn about our breeding program",
                    "created_at": "2025-03-05T00:00:00",
                    "updated_at": "2025-03-05T00:00:00"
                }
                return jsonify(page), 200
            elif slug == "contact":
                page = {
                    "id": 2,
                    "title": "Contact Us",
                    "slug": "contact",
                    "content": "<p>Contact information here.</p>",
                    "template": "contact",
                    "status": "published",
                    "meta_description": "Get in touch with us",
                    "created_at": "2025-03-05T00:00:00",
                    "updated_at": "2025-03-05T00:00:00"
                }
                return jsonify(page), 200
            else:
                return jsonify({"error": "Page not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('', methods=['POST'])
    @token_required
    def create_page(current_user):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            data = request.json
            required_fields = ['title', 'content']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400

            # Mock creating a page
            new_page = {
                "id": 3,  # Just assign a new ID
                "title": data.get('title'),
                "slug": data.get('slug') or data.get('title').lower().replace(' ', '-'),
                "content": data.get('content'),
                "template": data.get('template', 'default'),
                "status": data.get('status', 'published'),
                "meta_description": data.get('meta_description'),
                "created_at": "2025-03-05T00:00:00",
                "updated_at": "2025-03-05T00:00:00"
            }

            return jsonify(new_page), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['PUT'])
    @token_required
    def update_page(current_user, page_id):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            # Check if page exists (in our mock data)
            if page_id not in [1, 2]:
                return jsonify({"error": "Page not found"}), 404

            data = request.json
            
            # For testing, just return the updated data
            updated_page = {
                "id": page_id,
                "title": data.get('title', "Title"),
                "slug": data.get('slug', "slug"),
                "content": data.get('content', ""),
                "template": data.get('template', 'default'),
                "status": data.get('status', 'published'),
                "meta_description": data.get('meta_description', ""),
                "updated_at": "2025-03-05T00:00:00"
            }
            
            return jsonify(updated_page), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['DELETE'])
    @token_required
    def delete_page(current_user, page_id):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            # Check if page exists (in our mock data)
            if page_id not in [1, 2, 3]:
                return jsonify({"error": "Page not found"}), 404

            return jsonify({"message": "Page deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Return the blueprint
    return pages_bp