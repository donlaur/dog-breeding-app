from flask import Blueprint, request, jsonify
import traceback
from datetime import datetime

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
            # Get status filter from query params
            status = request.args.get('status')
            
            try:
                # Try to use the find method from our database abstraction layer
                if status:
                    # If we need to filter by status, we need to use find_by_field
                    pages = db.find_by_field("pages", "status", status)
                else:
                    # Otherwise just get all pages
pages = db.find_by_field_values("pages")
                
                # Sort pages by menu_order (would need to be done client-side or with a custom query)
                pages.sort(key=lambda p: p.get("menu_order", 0))
                
                print(f"Fetched {len(pages)} pages from database")
                return jsonify(pages), 200
            except AttributeError:
                # Fallback to direct Supabase access if the app is using that
                if hasattr(db, 'supabase'):
                    response = db.supabase.table("pages").select("*")
                    
                    # Apply optional status filter
                    if status:
                        response = response.eq("status", status)
                    
                    # Order by menu_order for navigation consistency
                    result = response.order("menu_order").execute()
                    
                    if result.data:
                        print(f"Fetched {len(result.data)} pages from database (direct Supabase)")
                        return jsonify(result.data), 200
                
                # If all else fails, return empty array
                print("No pages found in database")
                return jsonify([]), 200
                
        except Exception as e:
            print(f"Error in get_all_pages: {e}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['GET'])
    def get_page_by_id(page_id):
        try:
            try:
                # Try to use the get method from our database abstraction layer
                page = db.get("pages", page_id)
                
                if page:
                    return jsonify(page), 200
                else:
                    return jsonify({"error": "Page not found"}), 404
            except AttributeError:
                # Fallback to direct Supabase access
                if hasattr(db, 'supabase'):
                    result = db.supabase.table("pages").select("*").eq("id", page_id).execute()
                    
                    if result.data and len(result.data) > 0:
                        page = result.data[0]
                        return jsonify(page), 200
                
                return jsonify({"error": "Page not found"}), 404
        except Exception as e:
            print(f"Error fetching page by ID: {e}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/slug/<slug>', methods=['GET'])
    def get_page_by_slug(slug):
        try:
            try:
                # Try to use find_by_field from our database abstraction layer
                pages = db.find_by_field("pages", "slug", slug)
                
                if pages and len(pages) > 0:
                    page = pages[0]
                    
                    # For public access, only return published pages
                    if 'preview' not in request.args and page.get('status') != 'published':
                        return jsonify({"error": "Page not found"}), 404
                    
                    return jsonify(page), 200
                else:
                    return jsonify({"error": "Page not found"}), 404
            except AttributeError:
                # Fallback to direct Supabase access
                if hasattr(db, 'supabase'):
                    result = db.supabase.table("pages").select("*").eq("slug", slug).execute()
                    
                    if result.data and len(result.data) > 0:
                        page = result.data[0]
                        
                        # For public access, only return published pages
                        if 'preview' not in request.args and page.get('status') != 'published':
                            return jsonify({"error": "Page not found"}), 404
                        
                        return jsonify(page), 200
                
                return jsonify({"error": "Page not found"}), 404
        except Exception as e:
            print(f"Error fetching page by slug: {e}")
            traceback.print_exc()
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

            # Create a page record in the database
            page_data = {
                "title": data.get('title'),
                "slug": data.get('slug') or data.get('title').lower().replace(' ', '-').replace('.', ''),
                "content": data.get('content'),
                "template": data.get('template', 'default'),
                "status": data.get('status', 'published'),
                "meta_description": data.get('meta_description'),
                "show_in_menu": data.get('show_in_menu', False),
                "menu_order": data.get('menu_order', 0)
            }
            
            try:
                # Use our database abstraction layer
                # Check if slug already exists
                existing_pages = db.find_by_field("pages", "slug", page_data["slug"])
                if existing_pages and len(existing_pages) > 0:
                    return jsonify({"error": f"A page with slug '{page_data['slug']}' already exists"}), 400
                
                # Create the page
                new_page = db.create("pages", page_data)
                return jsonify(new_page), 201
            except AttributeError:
                # Fallback to direct Supabase access
                if hasattr(db, 'supabase'):
                    # Check if slug already exists
                    check_result = db.supabase.table("pages").select("id").eq("slug", page_data["slug"]).execute()
                    if check_result.data and len(check_result.data) > 0:
                        return jsonify({"error": f"A page with slug '{page_data['slug']}' already exists"}), 400
                    
                    # Insert page into database
                    result = db.supabase.table("pages").insert(page_data).execute()
                    
                    if result.data and len(result.data) > 0:
                        return jsonify(result.data[0]), 201
                
                return jsonify({"error": "Failed to create page"}), 500
                
        except Exception as e:
            print(f"Error creating page: {e}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['PUT'])
    @token_required
    def update_page(current_user, page_id):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            data = request.json
            
            # Prepare update data
            update_data = {
                "title": data.get('title'),
                "content": data.get('content'),
                "template": data.get('template'),
                "status": data.get('status'),
                "meta_description": data.get('meta_description'),
                "show_in_menu": data.get('show_in_menu'),
                "menu_order": data.get('menu_order'),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Remove None values from update data
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            try:
                # Try to use our database abstraction layer
                # Check if page exists
                existing_page = db.get("pages", page_id)
                if not existing_page:
                    return jsonify({"error": "Page not found"}), 404
                
                # Check if slug is being updated and if it already exists
                if 'slug' in data and data['slug'] != existing_page.get('slug'):
                    existing_slugs = db.find_by_field("pages", "slug", data['slug'])
                    if existing_slugs and len(existing_slugs) > 0:
                        return jsonify({"error": f"A page with slug '{data['slug']}' already exists"}), 400
                    update_data["slug"] = data['slug']
                
                # Update the page
                updated_page = db.update("pages", page_id, update_data)
                return jsonify(updated_page), 200
            except AttributeError:
                # Fallback to direct Supabase access
                if hasattr(db, 'supabase'):
                    # Check if page exists in database
                    check_result = db.supabase.table("pages").select("*").eq("id", page_id).execute()
                    if not check_result.data or len(check_result.data) == 0:
                        return jsonify({"error": "Page not found"}), 404
                    
                    # Check if slug is being updated and if it already exists
                    if 'slug' in data and data['slug'] != check_result.data[0].get('slug'):
                        slug_check = db.supabase.table("pages").select("id").eq("slug", data['slug']).execute()
                        if slug_check.data and len(slug_check.data) > 0:
                            return jsonify({"error": f"A page with slug '{data['slug']}' already exists"}), 400
                        update_data["slug"] = data['slug']
                    
                    # Update page in database
                    result = db.supabase.table("pages").update(update_data).eq("id", page_id).execute()
                    
                    if result.data and len(result.data) > 0:
                        return jsonify(result.data[0]), 200
                
                return jsonify({"error": "Failed to update page"}), 500
                
        except Exception as e:
            print(f"Error updating page: {e}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @pages_bp.route('/<int:page_id>', methods=['DELETE'])
    @token_required
    def delete_page(current_user, page_id):
        try:
            # Verify user is authorized (admin or breeder)
            if current_user['role'] not in ['ADMIN', 'BREEDER']:
                return jsonify({"error": "Unauthorized"}), 403

            try:
                # Try to use our database abstraction layer
                # Check if page exists
                existing_page = db.get("pages", page_id)
                if not existing_page:
                    return jsonify({"error": "Page not found"}), 404
                
                # Delete the page
                success = db.delete("pages", page_id)
                if success:
                    return jsonify({"message": "Page deleted successfully"}), 200
                else:
                    return jsonify({"error": "Failed to delete page"}), 500
            except AttributeError:
                # Fallback to direct Supabase access
                if hasattr(db, 'supabase'):
                    # Check if page exists in database
                    check_result = db.supabase.table("pages").select("id").eq("id", page_id).execute()
                    if not check_result.data or len(check_result.data) == 0:
                        return jsonify({"error": "Page not found"}), 404
                    
                    # Delete page from database
                    result = db.supabase.table("pages").delete().eq("id", page_id).execute()
                    
                    if result.data is not None:
                        return jsonify({"message": "Page deleted successfully"}), 200
                
                return jsonify({"error": "Failed to delete page"}), 500
                
        except Exception as e:
            print(f"Error deleting page: {e}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    # Return the blueprint
    return pages_bp