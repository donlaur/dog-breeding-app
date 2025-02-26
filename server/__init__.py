from flask import Flask
from flask_cors import CORS
from .config import debug_log, SUPABASE_URL, SUPABASE_KEY
from .database.supabase_db import SupabaseDatabase
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
import json

def get_db():
    debug_log("Initializing database connection...")
    return SupabaseDatabase(SUPABASE_URL, SUPABASE_KEY)

def create_app(test_config=None):
    load_dotenv()
    app = Flask(__name__)
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins for testing
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    debug_log("Initializing Flask application...")
    
    if test_config is not None:
        app.config.update(test_config)
    
    db = get_db()
    
    # Register blueprints
    from .dogs import create_dogs_bp
    from .litters import create_litters_bp
    from .program import create_program_bp
    from .heats import create_heats_bp
    from .messages import create_messages_bp
    from .breeds import breeds_bp
    # Import auth blueprint
    
    # Create auth blueprint directly in __init__.py
    auth_bp = Blueprint("auth_bp", __name__)
    
    # Read admin emails from environment variable
    def get_admin_emails():
        from os import environ
        admin_emails_str = environ.get('ADMIN_EMAILS', '')
        return [email.strip() for email in admin_emails_str.split(',') if email.strip()]
    
    @auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
    def auth_signup():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        # Handle actual request
        data = request.get_json()
        email = data.get('email', '')
        name = data.get('name', '')
        password = data.get('password', '')
        
        # Determine role based on email
        admin_emails = get_admin_emails()
        role = 'ADMIN' if email in admin_emails else 'BUYER'  # Default to BUYER for normal users
        
        try:
            # Check if user already exists
            existing_users = db.get_filtered("users", {"email": email})
            if existing_users and len(existing_users) > 0:
                return jsonify({"error": "User with this email already exists"}), 400
            
            # Create new user
            user_data = {
                "email": email,
                "name": name,
                "password_hash": password,  # In production, hash the password
                "role": role
            }
            
            new_user = db.create("users", user_data)
            
            return jsonify({
                'message': 'User created successfully',
                'token': 'test-token',
                'user': {
                    'id': new_user.get('id'),
                    'email': new_user.get('email'),
                    'name': new_user.get('name'),
                    'role': new_user.get('role')
                }
            }), 201
        
        except Exception as e:
            print(f"Database error during signup: {str(e)}")
            # Fall back to in-memory mode for development
            return jsonify({
                'message': 'User created (in-memory mode)',
                'token': 'test-token',
                'user': {
                    'id': 1,
                    'email': email,
                    'name': name,
                    'role': role
                }
            }), 201
    
    @auth_bp.route('/login', methods=['POST', 'OPTIONS'])
    def auth_login():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        
        # Handle actual request
        try:
            print(f"Request content type: {request.content_type}")
            print(f"Request data type: {type(request.data)}")
            print(f"Request data: {request.data}")
            
            # Try to parse the data
            data = {}
            
            # Check if we're getting a JSON request
            if request.is_json:
                json_data = request.get_json(force=True)
                
                # Handle the case where the data is just an email string
                if isinstance(json_data, str) and '@' in json_data:
                    # Client is sending only an email as JSON string
                    data = {
                        "email": json_data.strip('"'), 
                        "password": "admin-password"  # Use a default password for testing
                    }
                    print(f"Using default password for email: {data['email']}")
                else:
                    # Normal JSON object
                    data = json_data
            
            # If data is still not a dictionary, check other formats
            if not isinstance(data, dict):
                # Try to parse form data
                data = {}
                for key in request.form:
                    data[key] = request.form[key]
                
                # If still empty, create default test values 
                if not data:
                    data = {"email": "admin@example.com", "password": "admin-password"}
                    print("Using default admin credentials for testing")
            
            email = data.get('email', '')
            password = data.get('password', '')
            
            print(f"Using email: {email}, Password length: {len(password)}")
            
            # Find user by email
            users = db.get_filtered("users", {"email": email})
            
            if not users or len(users) == 0:
                # For testing: auto-create admin user if not found
                admin_emails = get_admin_emails()
                if email in admin_emails or email == "admin@example.com" or email == "donlaur@gmail.com":
                    # Create a test admin user
                    user_data = {
                        "email": email,
                        "name": "Admin User",
                        "password_hash": password,
                        "role": "ADMIN"
                    }
                    try:
                        new_user = db.create("users", user_data)
                        print(f"Created test admin user: {email}")
                        return jsonify({
                            'message': 'Login successful (test user created)',
                            'token': 'test-token',
                            'user': {
                                'id': new_user.get('id'),
                                'email': new_user.get('email'),
                                'name': new_user.get('name'),
                                'role': new_user.get('role')
                            }
                        }), 200
                    except Exception as create_err:
                        print(f"Error creating test user: {str(create_err)}")
                
                return jsonify({"error": "Invalid credentials"}), 401
            
            user = users[0]
            
            # In production, verify password hash
            # For development, accept any password
            if user.get('password_hash') != password and password != "admin-password":
                print(f"Password mismatch: Got '{password}', expected '{user.get('password_hash')}'")
                # For testing, accept any password
                print("Bypassing password check for development")
            
            return jsonify({
                'message': 'Login successful',
                'token': 'test-token',
                'user': {
                    'id': user.get('id'),
                    'email': user.get('email'),
                    'name': user.get('name'),
                    'role': user.get('role')
                }
            }), 200
        
        except Exception as e:
            print(f"Login exception: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Login failed: {str(e)}"}), 500
    
    @auth_bp.route('/verify', methods=['GET', 'OPTIONS'])
    def auth_verify():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        
        # Handle token verification
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        # Get user email from token or headers
        email = request.headers.get('X-User-Email', '')
        
        if not email:
            # In development, assume admin for any token
            return jsonify({
                'message': 'Token verified (in-memory mode)',
                'user': {
                    'id': 1,
                    'email': 'admin@example.com',
                    'name': 'Test User',
                    'role': 'admin'
                }
            }), 200
        
        try:
            # Find user by email
            users = db.get_filtered("users", {"email": email})
            
            if not users or len(users) == 0:
                # Fall back to checking admin emails
                admin_emails = get_admin_emails()
                role = 'admin' if email in admin_emails else 'user'
                
                return jsonify({
                    'message': 'Token verified (in-memory mode)',
                    'user': {
                        'id': 1,
                        'email': email,
                        'name': 'Test User',
                        'role': role
                    }
                }), 200
            
            user = users[0]
            
            return jsonify({
                'message': 'Token verified',
                'user': {
                    'id': user.get('id'),
                    'email': user.get('email'),
                    'name': user.get('name'),
                    'role': user.get('role')
                }
            }), 200
        
        except Exception as e:
            print(f"Database error during verification: {str(e)}")
            # Fall back to admin email check
            admin_emails = get_admin_emails()
            role = 'admin' if email in admin_emails else 'user'
            
            return jsonify({
                'message': 'Token verified (in-memory mode)',
                'user': {
                    'id': 1,
                    'email': email,
                    'name': 'Test User',
                    'role': role
                }
            }), 200
    
    print("\n=== Registering blueprints... ===")
    
    # Register blueprints with error handling
    try:
        app.register_blueprint(create_dogs_bp(db), url_prefix="/api/dogs")
        print("✓ Registered dogs_bp")
    except Exception as e:
        print(f"✗ Failed to register dogs_bp: {str(e)}")
    
    try:
        print("Attempting to register breeds_bp...")
        if not hasattr(breeds_bp, 'name'):
            print("Warning: breeds_bp doesn't seem to be a valid blueprint")
        app.register_blueprint(breeds_bp, url_prefix="/api/breeds")
        print("✓ Registered breeds_bp")
    except Exception as e:
        print(f"✗ Failed to register breeds_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_litters_bp(db), url_prefix="/api/litters")
        print("✓ Registered litters_bp")
    except Exception as e:
        print(f"✗ Failed to register litters_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_program_bp(db), url_prefix="/api/program")
        print("✓ Registered program_bp")
    except Exception as e:
        print(f"✗ Failed to register program_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_heats_bp(db), url_prefix="/api/heats")
        print("✓ Registered heats_bp")
    except Exception as e:
        print(f"✗ Failed to register heats_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_messages_bp(db), url_prefix="/api")
        print("✓ Registered messages_bp")
    except Exception as e:
        print(f"✗ Failed to register messages_bp: {str(e)}")
    
    try:
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        print("✓ Registered auth_bp")
    except Exception as e:
        print(f"✗ Failed to register auth_bp: {str(e)}")
    
    # Remove the @app.before_first_request decorator
    # Instead, use a one-time initialization function
    def initialize_database():
        # The database interface doesn't support direct SQL execution
        # We need to check if the users table exists, and if not, create it manually in Supabase
        try:
            # Try to query the users table to see if it exists
            db.get_all("users")
            print("Users table exists")
        except Exception as e:
            print(f"Users table check failed: {str(e)}")
            print("Please create the users table manually in Supabase with the SQL in the README")
        
        # Let the auth routes work without database temporarily
        print("Using in-memory authentication for development")

    # Call the initialization function directly
    with app.app_context():
        initialize_database()
    
    @app.route('/api/setup-admin', methods=['GET'])
    def setup_admin():
        admin_emails = get_admin_emails()
        if not admin_emails:
            return jsonify({"error": "No admin emails configured. Set ADMIN_EMAILS in .env file."}), 400
        
        admin_email = admin_emails[0]
        
        try:
            # Check if admin already exists
            existing_users = db.get_filtered("users", {"email": admin_email})
            if existing_users and len(existing_users) > 0:
                return jsonify({"message": f"Admin user {admin_email} already exists"}), 200
            
            # Create admin user
            user_data = {
                "email": admin_email,
                "name": "Admin User",
                "password_hash": "admin-password",  # Change this to a secure password
                "role": "ADMIN"  # Using the correct role from our constraint
            }
            
            new_user = db.create("users", user_data)
            
            return jsonify({
                'message': f'Admin user created successfully: {admin_email}',
                'user': new_user
            }), 201
        
        except Exception as e:
            return jsonify({"error": f"Failed to create admin user: {str(e)}"}), 500
    
    debug_log("Application initialization complete")
    return app