from flask import Blueprint, request, jsonify
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

from server.middleware.auth import token_required

def create_pages_blueprint(db):
    print("Creating pages blueprint")
    pages_bp = Blueprint('pages', __name__)
    
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
            page = Page.get_by_id(page_id)
            if not page:
                return jsonify({"error": "Page not found"}), 404
            return jsonify(page), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/slug/<slug>', methods=['GET'])
    def get_page_by_slug(slug):
        try:
            page = Page.get_by_slug(slug)
            if not page:
                return jsonify({"error": "Page not found"}), 404
            return jsonify(page), 200
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

            # Extract fields
            title = data.get('title')
            content = data.get('content')
            slug = data.get('slug')
            template = data.get('template', 'default')
            status = data.get('status', 'published')
            meta_description = data.get('meta_description')

            # Create page
            page = Page.create_page(
                title=title,
                content=content,
                slug=slug,
                template=template,
                status=status,
                meta_description=meta_description
            )

            return jsonify(page), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['PUT'])
    @token_required
    def update_page(current_user, page_id):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            # Check if page exists
            existing_page = Page.get_by_id(page_id)
            if not existing_page:
                return jsonify({"error": "Page not found"}), 404

            data = request.json
            update_data = {}
            
            # Only update provided fields
            allowed_fields = ['title', 'content', 'slug', 'template', 'status', 'meta_description']
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]

            # Update page
            updated_page = Page.update_page(page_id, update_data)
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

            # Check if page exists
            existing_page = Page.get_by_id(page_id)
            if not existing_page:
                return jsonify({"error": "Page not found"}), 404

            # Delete page
            Page.delete_page(page_id)
            return jsonify({"message": "Page deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return pages_bp