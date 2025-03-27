"""
app.py

Simple entrypoint that creates the Flask app using the factory in __init__.py
"""

import os
import sys
import logging
import traceback
from flask import Flask, jsonify, send_from_directory, redirect, url_for, request
from flask_cors import CORS  # Import CORS
from werkzeug.exceptions import HTTPException, InternalServerError, NotFound

# Add the parent directory to sys.path to allow imports from server module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
from server.files import create_files_bp
from server.events import create_events_bp
from server.search import create_search_bp
from server.customers import create_customers_bp
from server.applications import applications_bp
from server.health import create_health_bp
from server.routes.leads import leads_bp
from server.routes.messages import messages_bp
from server.notifications import notifications_bp
from server.system_health import create_system_health_bp
from server.uploads import create_uploads_bp
from server.contracts import create_contracts_bp
from server.application_forms import create_application_forms_bp
from server.customer_leads import create_customer_leads_bp

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
    
    # Configure logging
    configure_logging(app)
    
    # Setup CORS for all routes
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Setup static file serving for uploads
    setup_file_serving(app)
    
    # Create database interface
    try:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
            'DATABASE_URL',
            'postgresql://user:password@mcp-database-host:5432/dog_breeding_db'
        )
        # Force use FallbackDatabase for testing
        print("Using FallbackDatabase for testing purposes")
        raise ValueError("Forced fallback for testing")
        db = SupabaseDatabase()
    except Exception as e:
        app.logger.error(f"Database initialization error: {e}")
        db = FallbackDatabase()  # Define this class below
    
    # Initialize Cloudinary service if needed
    try:
        from server.cloudinary_service import CloudinaryService
        cloudinary_service = CloudinaryService()
        app.config['CLOUDINARY_SERVICE'] = cloudinary_service
        app.logger.info("Cloudinary service initialized successfully")
    except Exception as e:
        app.logger.warning(f"Unable to initialize Cloudinary service: {e}")
        app.config['CLOUDINARY_SERVICE'] = None
    
    # Register blueprints with error handling
    register_blueprints(app, db)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Add health check endpoint
    @app.route('/api/health-check')
    def health_check():
        """Basic health check endpoint to verify API is running"""
        return jsonify({
            "status": "ok",
            "message": "Service is running",
            "timestamp": import_datetime().now().isoformat()
        })
    
    # Add global request logging middleware
    @app.before_request
    def log_request_info():
        """Log request details for debugging"""
        if request.path != '/api/health-check':  # Skip logging health checks
            app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    
    return app

def import_datetime():
    """Helper function to safely import datetime"""
    try:
        from datetime import datetime
        return datetime
    except ImportError:
        class FallbackDatetime:
            @staticmethod
            def now():
                class Now:
                    @staticmethod
                    def isoformat():
                        return "datetime-import-error"
                return Now()
        return FallbackDatetime()

def configure_logging(app):
    """Configure application logging with proper exception handling"""
    try:
        # Set up file handler
        log_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        os.makedirs(log_directory, exist_ok=True)
        
        log_file = os.path.join(log_directory, 'app.log')
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_formatter)
        app.logger.addHandler(file_handler)
        
        # Set up console handler for all environments
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(console_formatter)
        app.logger.addHandler(console_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info("Logging configured successfully")
    except Exception as e:
        print(f"Warning: Failed to configure logging: {e}")
        # Setup minimal console logging as fallback
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.WARNING)
        app.logger.warning(f"Using fallback logging configuration due to error: {e}")

def setup_file_serving(app):
    """Setup static file serving with proper error handling"""
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        """Serve uploaded files directly from the uploads directory"""
        try:
            debug_log(f"Serving uploaded file: {filename}")
            uploads_path = os.path.join(app.root_path, 'uploads')
            if not os.path.exists(uploads_path):
                os.makedirs(uploads_path, exist_ok=True)
                
            # Add detailed logging to diagnose file serving issues
            file_full_path = os.path.join(uploads_path, filename)
            debug_log(f"Looking for file at full path: {file_full_path}")
            
            if not os.path.exists(file_full_path):
                # Log all files in the directory to help diagnose issues
                try:
                    available_files = os.listdir(uploads_path)
                    debug_log(f"File not found. Available files in {uploads_path}: {available_files}")
                except Exception as list_err:
                    debug_log(f"Error listing available files: {list_err}")
                
                app.logger.warning(f"Requested file not found: {filename}")
                
                # For debugging - try looking for a similar file (case insensitive match)
                try:
                    for existing_file in os.listdir(uploads_path):
                        if existing_file.lower() == filename.lower():
                            debug_log(f"Found case-insensitive match: {existing_file}")
                            return send_from_directory(uploads_path, existing_file)
                except Exception as case_err:
                    debug_log(f"Error checking for case matches: {case_err}")
                
                return jsonify({"error": "File not found", "path": file_full_path}), 404
                
            # Set the correct MIME type based on file extension
            debug_log(f"File found, serving: {file_full_path}")
            return send_from_directory(uploads_path, filename)
        except Exception as e:
            app.logger.error(f"Error serving file {filename}: {e}")
            return jsonify({"error": "Error serving file", "details": str(e)}), 500
    
    # Create additional routes for different URL patterns to handle various client requests
    @app.route('/api/uploads/<path:filename>')
    def serve_api_upload(filename):
        """Serve uploaded files through the API path"""
        try:
            debug_log(f"Serving uploaded file through API path: {filename}")
            return redirect(url_for('serve_upload', filename=filename))
        except Exception as e:
            app.logger.error(f"Error redirecting for file {filename}: {e}")
            return jsonify({"error": "Error serving file", "details": str(e)}), 500
    
    # Add a route to list all uploads from the uploads directory
    @app.route('/uploads')
    def list_uploads_direct():
        """List all files in the uploads directory"""
        try:
            upload_dir = os.path.join(app.root_path, 'uploads')
            
            # Create the directory if it doesn't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            # List all files in the directory
            files = []
            for filename in os.listdir(upload_dir):
                if os.path.isfile(os.path.join(upload_dir, filename)):
                    files.append(filename)
                    
            return jsonify({
                "ok": True,
                "files": files
            })
        except Exception as e:
            debug_log(f"Error listing files directly: {str(e)}")
            return jsonify({
                "ok": False,
                "error": f"Error listing files: {str(e)}"
            }), 500

def register_blueprints(app, db):
    """Register all blueprints with error handling"""
    blueprints = [
        (create_dogs_bp(db), '/api/dogs'),
        (create_litters_bp(db), '/api/litters'),
        (breeds_bp, '/api/breeds'),
        (create_heats_bp(db), '/api/heats'),
        (create_auth_bp(db), '/api/auth'),
        (create_program_bp(db), '/api/program'),
        (create_puppies_bp(db), '/api/puppies'),
        (create_photos_bp(db), '/api/photos'),
        (create_files_bp(db), '/api/files'),
        (create_events_bp(db), '/api/events'),
        (create_search_bp(db), '/api/search'),
        (create_customers_bp(db), '/api/customers'),
        (applications_bp, ''),  # Uses its own URL prefix
        (create_health_bp(), '/api/health'),
        (leads_bp, '/api/leads'),
        (messages_bp, '/api/messages'),
        (notifications_bp, '/api'),  # Changed from empty string to '/api'
        (create_system_health_bp(), '/api/system'),  # Routes: /api/system/ and /api/system/health
        (create_uploads_bp(db), '/api/uploads'),
        (create_contracts_bp(db), '/api/contracts'),
        (create_application_forms_bp(db), '/api/application-forms'),
        (create_customer_leads_bp(db), '/api/customers/recent_leads'),
    ]
    
    for blueprint, url_prefix in blueprints:
        try:
            app.register_blueprint(blueprint, url_prefix=url_prefix)
            app.logger.info(f"Registered blueprint at {url_prefix}")
        except Exception as e:
            app.logger.error(f"Failed to register blueprint for {url_prefix}: {e}")
    
    # Handle pages blueprint separately since it's more prone to errors
    try:
        app.logger.info("Attempting to create pages blueprint...")
        pages_bp = create_pages_blueprint(db)
        app.logger.info(f"Pages blueprint created successfully: {pages_bp}")
        
        app.logger.info("Attempting to register pages blueprint...")
        app.register_blueprint(pages_bp, url_prefix='/api/pages')
        app.logger.info("Pages blueprint registered successfully")
        
        # Print all routes after registration
        app.logger.info("\nRoutes after registering pages blueprint:")
        for rule in app.url_map.iter_rules():
            if 'pages' in rule.rule:
                app.logger.info(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    except Exception as e:
        app.logger.error(f"Error registering pages blueprint: {e}")
        app.logger.error(traceback.format_exc())

def register_error_handlers(app):
    """Register comprehensive error handlers"""
    @app.errorhandler(404)
    def not_found_error(error):
        app.logger.warning(f"404 Error: {error} - Path: {request.path}")
        response = jsonify({
            "error": "Resource not found",
            "path": request.path,
            "status": 404
        })
        response.status_code = 404
        return add_cors_headers(response)
    
    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"500 Error: {error}")
        app.logger.error(traceback.format_exc())
        response = jsonify({
            "error": "Internal server error",
            "status": 500,
            "message": "The server encountered an unexpected condition that prevented it from fulfilling the request."
        })
        response.status_code = 500
        return add_cors_headers(response)
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if isinstance(e, HTTPException):
            app.logger.warning(f"HTTP Exception {e.code}: {e}")
            response = jsonify({
                "error": e.name,
                "status": e.code,
                "message": e.description
            })
            response.status_code = e.code
        else:
            app.logger.error(f"Unhandled Exception: {e}")
            app.logger.error(traceback.format_exc())
            response = jsonify({
                "error": "Internal server error",
                "status": 500,
                "message": "The server encountered an unexpected condition."
            })
            response.status_code = 500
        return add_cors_headers(response)

def add_cors_headers(response):
    """Add CORS headers to response"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

class FallbackDatabase:
    """Fallback database class when main database is unavailable"""
    def __init__(self):
        self.available = False
        self.error_message = "Database connection failed. Using fallback stub database."
    
    def execute(self, *args, **kwargs):
        """Return empty results for any query"""
        return []
    
    def get(self, *args, **kwargs):
        """Return None for any get operation"""
        return None
    
    def __getattr__(self, name):
        """Handle any attribute access with a method that returns None"""
        def method(*args, **kwargs):
            return None
        return method

if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Start the Flask server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    
    try:
        args = parser.parse_args()
        
        app = create_app()
        print(f"Starting server on {args.host}:{args.port}...")
        app.run(debug=args.debug, port=args.port, host=args.host)
    except Exception as e:
        print(f"Critical error starting application: {e}")
        traceback.print_exc()
        sys.exit(1)
